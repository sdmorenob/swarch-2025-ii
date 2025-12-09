output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_oidc_issuer_url" {
  description = "EKS OIDC issuer"
  value       = module.eks.cluster_oidc_issuer_url
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnets" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnets
}

output "private_subnets" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnets
}

output "ecr_repositories" {
  description = "ECR repositories and URIs"
  value       = { for k, v in aws_ecr_repository.repos : k => v.repository_url }
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN for ingress (if created)"
  value       = length(aws_acm_certificate.ingress) > 0 ? aws_acm_certificate.ingress[0].arn : ""
}
