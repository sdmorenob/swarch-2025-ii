locals {
  common_tags = merge(
    {
      Project = "TaskNotes"
      Owner   = "CuervosTeam"
    },
    var.tags,
  )

  caller_is_assumed_role = can(regex("arn:aws:sts::\\d+:assumed-role/.+", data.aws_caller_identity.current.arn))
  caller_is_iam_role     = can(regex("arn:aws:iam::\\d+:role/.+", data.aws_caller_identity.current.arn))
  caller_is_iam_user     = can(regex("arn:aws:iam::\\d+:user/.+", data.aws_caller_identity.current.arn))

  caller_as_iam_role_arn = local.caller_is_assumed_role ? replace(
    data.aws_caller_identity.current.arn,
    "arn:aws:sts::${data.aws_caller_identity.current.account_id}:assumed-role/",
    "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/",
  ) : null

  admin_role_arn = local.caller_is_assumed_role ? local.caller_as_iam_role_arn : (local.caller_is_iam_role ? data.aws_caller_identity.current.arn : null)
  admin_user_arn = local.caller_is_iam_user ? data.aws_caller_identity.current.arn : null
}

data "aws_caller_identity" "current" {}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.8"

  name = "${var.cluster_name}-vpc"

  cidr = var.vpc_cidr
  azs  = var.azs

  public_subnets  = var.public_subnets
  private_subnets = var.private_subnets

  enable_nat_gateway = true
  single_nat_gateway = var.single_nat_gateway

  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = local.common_tags
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.24"

  cluster_name                   = var.cluster_name
  cluster_version                = var.kubernetes_version
  enable_irsa                    = true
  cluster_endpoint_public_access = true

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent              = true
      service_account_role_arn = aws_iam_role.ebs_csi.arn
    }
  }

  eks_managed_node_groups = {
    default = {
      min_size       = var.node_min_size
      max_size       = var.node_max_size
      desired_size   = var.node_desired_size
      instance_types = var.node_instance_types
      capacity_type  = "ON_DEMAND"
      subnet_ids     = module.vpc.private_subnets
      ami_type       = "AL2023_x86_64_STANDARD"
    }
  }

  access_entries = {
    admin = {
      principal_arn = coalesce(local.admin_role_arn, local.admin_user_arn)
      type          = "STANDARD"

      policy_associations = {
        admin = {
          policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
          access_scope = {
            type = "cluster"
          }
        }
      }
    }
  }

  tags = local.common_tags
}

module "aws_auth" {
  source  = "terraform-aws-modules/eks/aws//modules/aws-auth"
  version = "~> 20.24"

  manage_aws_auth_configmap = true
  aws_auth_roles = local.admin_role_arn != null ? [
    {
      rolearn  = local.admin_role_arn
      username = "admin"
      groups   = ["system:masters"]
    }
  ] : []

  aws_auth_users = local.admin_user_arn != null ? [
    {
      userarn  = local.admin_user_arn
      username = "admin"
      groups   = ["system:masters"]
    }
  ] : []

  depends_on = [module.eks]
}

data "aws_eks_cluster" "this" {
  name       = module.eks.cluster_name
  depends_on = [module.eks]
}

data "aws_eks_cluster_auth" "this" {
  name       = module.eks.cluster_name
  depends_on = [module.eks]
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.this.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.this.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.this.token
}

provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.this.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.this.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.this.token
  }
}

data "aws_iam_policy" "ebs_csi" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
}

data "aws_iam_policy_document" "ebs_csi_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [module.eks.oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(module.eks.cluster_oidc_issuer_url, "https://", "")}:sub"
      values   = ["system:serviceaccount:kube-system:ebs-csi-controller-sa"]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(module.eks.cluster_oidc_issuer_url, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ebs_csi" {
  name               = "${var.cluster_name}-ebs-csi"
  assume_role_policy = data.aws_iam_policy_document.ebs_csi_assume.json
  tags               = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ebs_csi" {
  role       = aws_iam_role.ebs_csi.name
  policy_arn = data.aws_iam_policy.ebs_csi.arn
}

resource "kubernetes_namespace" "tasknotes" {
  metadata {
    name = "tasknotes"
    labels = {
      app = "tasknotes"
    }
  }
}

data "aws_iam_policy_document" "alb_controller" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [module.eks.oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(module.eks.cluster_oidc_issuer_url, "https://", "")}:sub"
      values   = ["system:serviceaccount:kube-system:aws-load-balancer-controller"]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(module.eks.cluster_oidc_issuer_url, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "alb_controller" {
  name = "${var.cluster_name}-alb-controller"
  path = "/"

  # Source: https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json
  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {"Effect": "Allow", "Action": ["iam:CreateServiceLinkedRole"], "Resource": "*", "Condition": {"StringEquals": {"iam:AWSServiceName": "elasticloadbalancing.amazonaws.com"}}},
    {"Effect": "Allow", "Action": ["ec2:DescribeAccountAttributes","ec2:DescribeAddresses","ec2:DescribeAvailabilityZones","ec2:DescribeInternetGateways","ec2:DescribeVpcs","ec2:DescribeVpcPeeringConnections","ec2:DescribeSubnets","ec2:DescribeSecurityGroups","ec2:DescribeInstances","ec2:DescribeNetworkInterfaces","ec2:DescribeTags","ec2:GetCoipPoolUsage","ec2:DescribeCoipPools"], "Resource": "*"},
    {"Effect": "Allow", "Action": ["ec2:AuthorizeSecurityGroupIngress","ec2:RevokeSecurityGroupIngress"], "Resource": "*"},
    {"Effect": "Allow", "Action": ["elasticloadbalancing:CreateLoadBalancer","elasticloadbalancing:CreateTargetGroup"], "Resource": "*"},
    {"Effect": "Allow", "Action": ["elasticloadbalancing:CreateListener","elasticloadbalancing:DeleteListener","elasticloadbalancing:CreateRule","elasticloadbalancing:DeleteRule"], "Resource": "*"},
    {"Effect": "Allow", "Action": ["elasticloadbalancing:AddTags","elasticloadbalancing:RemoveTags"], "Resource": ["arn:aws:elasticloadbalancing:*:*:targetgroup/*/*","arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*","arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*"], "Condition": {"Null": {"elasticloadbalancing:CreateAction": "false"}}},
    {"Effect": "Allow", "Action": ["elasticloadbalancing:AddTags"], "Resource": ["arn:aws:elasticloadbalancing:*:*:targetgroup/*/*","arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*","arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*"], "Condition": {"StringEquals": {"elasticloadbalancing:CreateAction": ["CreateTargetGroup","CreateLoadBalancer"]}}},
    {"Effect": "Allow", "Action": ["elasticloadbalancing:RemoveTags"], "Resource": ["arn:aws:elasticloadbalancing:*:*:targetgroup/*/*","arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*","arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*"], "Condition": {"StringEquals": {"elasticloadbalancing:CreateAction": "CreateTargetGroup"}}},
    {"Effect": "Allow", "Action": ["elasticloadbalancing:SetWebAcl","elasticloadbalancing:ModifyListener","elasticloadbalancing:AddListenerCertificates","elasticloadbalancing:RemoveListenerCertificates","elasticloadbalancing:ModifyRule"], "Resource": "*"},
    {"Effect": "Allow", "Action": ["elasticloadbalancing:DescribeLoadBalancers","elasticloadbalancing:DescribeLoadBalancerAttributes","elasticloadbalancing:DescribeListeners","elasticloadbalancing:DescribeListenerCertificates","elasticloadbalancing:DescribeSSLPolicies","elasticloadbalancing:DescribeRules","elasticloadbalancing:DescribeTargetGroups","elasticloadbalancing:DescribeTargetGroupAttributes","elasticloadbalancing:DescribeTargetHealth","elasticloadbalancing:DescribeTags"], "Resource": "*"},
    {"Effect": "Allow", "Action": ["cognito-idp:DescribeUserPoolClient"], "Resource": "*"},
    {"Effect": "Allow", "Action": ["acm:ListCertificates","acm:DescribeCertificate"], "Resource": "*"},
    {"Effect": "Allow", "Action": ["ssm:GetParameter"], "Resource": "arn:aws:ssm:*:*:parameter/AWSALB/*"},
    {"Effect": "Allow", "Action": ["waf-regional:GetWebACL","waf-regional:GetWebACLForResource","waf-regional:AssociateWebACL","waf-regional:DisassociateWebACL","wafv2:GetWebACL","wafv2:GetWebACLForResource","wafv2:AssociateWebACL","wafv2:DisassociateWebACL","shield:GetSubscriptionState","shield:DescribeProtection","shield:CreateProtection","shield:DeleteProtection"], "Resource": "*"},
    {"Effect": "Allow", "Action": ["iam:ListServerCertificates","iam:GetServerCertificate"], "Resource": "*"},
    {"Effect": "Allow", "Action": ["iam:CreateServiceLinkedRole"], "Resource": "*", "Condition": {"StringEquals": {"iam:AWSServiceName": "elasticloadbalancing.amazonaws.com"}}},
    {"Effect": "Allow", "Action": ["ec2:CreateSecurityGroup"], "Resource": "*"},
    {"Effect": "Allow", "Action": ["elasticloadbalancing:SetSecurityGroups","elasticloadbalancing:ModifyLoadBalancerAttributes","elasticloadbalancing:SetSubnets","elasticloadbalancing:DeleteLoadBalancer","elasticloadbalancing:ModifyTargetGroup","elasticloadbalancing:ModifyTargetGroupAttributes","elasticloadbalancing:DeleteTargetGroup"], "Resource": "*"},
    {"Effect": "Allow", "Action": ["ec2:AuthorizeSecurityGroupIngress"], "Resource": "*"},
    {"Effect": "Allow", "Action": ["ec2:RevokeSecurityGroupIngress"], "Resource": "*"},
    {"Effect": "Allow", "Action": ["ec2:DeleteSecurityGroup"], "Resource": "*"}
  ]
}
POLICY
}

resource "aws_iam_role" "alb_controller" {
  name               = "${var.cluster_name}-alb-controller"
  assume_role_policy = data.aws_iam_policy_document.alb_controller.json
  tags               = local.common_tags
}

resource "aws_iam_role_policy_attachment" "alb_controller" {
  role       = aws_iam_role.alb_controller.name
  policy_arn = aws_iam_policy.alb_controller.arn
}

resource "kubernetes_service_account" "alb_controller" {
  metadata {
    name      = "aws-load-balancer-controller"
    namespace = "kube-system"
    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.alb_controller.arn
    }
  }
}

resource "helm_release" "aws_load_balancer_controller" {
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  version    = var.alb_ingress_controller_version
  namespace  = "kube-system"

  set {
    name  = "clusterName"
    value = module.eks.cluster_name
  }

  set {
    name  = "region"
    value = var.aws_region
  }

  set {
    name  = "vpcId"
    value = module.vpc.vpc_id
  }

  set {
    name  = "serviceAccount.create"
    value = "false"
  }

  set {
    name  = "serviceAccount.name"
    value = kubernetes_service_account.alb_controller.metadata[0].name
  }

  depends_on = [aws_iam_role_policy_attachment.alb_controller]
}

resource "helm_release" "metrics_server" {
  name       = "metrics-server"
  repository = "https://kubernetes-sigs.github.io/metrics-server/"
  chart      = "metrics-server"
  version    = var.metrics_server_chart_version
  namespace  = "kube-system"

  set {
    name  = "args"
    value = "{--kubelet-insecure-tls}"
  }

  depends_on = [module.eks]
}

resource "aws_ecr_repository" "repos" {
  for_each = toset(var.ecr_repositories)

  name                 = each.value
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = local.common_tags
}

resource "aws_ecr_lifecycle_policy" "repos" {
  for_each = aws_ecr_repository.repos

  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Retain last 15 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 15
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

resource "aws_acm_certificate" "ingress" {
  count                     = length(var.domain_name) > 0 && length(var.hosted_zone_id) > 0 ? 1 : 0
  domain_name               = var.domain_name
  validation_method         = "DNS"
  subject_alternative_names = ["*.${var.domain_name}"]
  tags                      = local.common_tags
}

resource "aws_route53_record" "ingress_validation" {
  count = length(var.domain_name) > 0 && length(var.hosted_zone_id) > 0 ? length(aws_acm_certificate.ingress[0].domain_validation_options) : 0

  allow_overwrite = true
  name            = aws_acm_certificate.ingress[0].domain_validation_options[count.index].resource_record_name
  records         = [aws_acm_certificate.ingress[0].domain_validation_options[count.index].resource_record_value]
  ttl             = 60
  type            = aws_acm_certificate.ingress[0].domain_validation_options[count.index].resource_record_type
  zone_id         = var.hosted_zone_id
}

resource "aws_acm_certificate_validation" "ingress" {
  count                   = length(var.domain_name) > 0 && length(var.hosted_zone_id) > 0 ? 1 : 0
  certificate_arn         = aws_acm_certificate.ingress[0].arn
  validation_record_fqdns = [for r in aws_route53_record.ingress_validation : r.fqdn]
}