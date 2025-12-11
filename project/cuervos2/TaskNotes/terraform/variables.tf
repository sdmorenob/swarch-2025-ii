variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "tasknotes-eks"
}

variable "kubernetes_version" {
  description = "EKS Kubernetes version"
  type        = string
  default     = "1.29"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "azs" {
  description = "Availability Zones to use"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "public_subnets" {
  description = "Public subnet CIDRs (one per AZ)"
  type        = list(string)
  default     = ["10.0.0.0/24", "10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnets" {
  description = "Private subnet CIDRs (one per AZ)"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
}

variable "single_nat_gateway" {
  description = "Whether to use a single shared NAT gateway"
  type        = bool
  default     = true
}

variable "node_instance_types" {
  description = "EC2 instance types for the default managed node group"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_desired_size" {
  description = "Desired nodes in the default node group"
  type        = number
  default     = 3
}

variable "node_min_size" {
  description = "Minimum nodes in the default node group"
  type        = number
  default     = 2
}

variable "node_max_size" {
  description = "Maximum nodes in the default node group"
  type        = number
  default     = 6
}

variable "domain_name" {
  description = "Root domain for the ingress (for ACM certificate). Leave empty to skip creation"
  type        = string
  default     = ""
}

variable "hosted_zone_id" {
  description = "Route53 Hosted Zone ID for DNS validation. Leave empty to skip certificate creation"
  type        = string
  default     = ""
}

variable "ecr_repositories" {
  description = "List of ECR repositories to create"
  type        = list(string)
  default = [
    "api-gateway",
    "frontend-micro",
    "frontend-ssr",
    "auth-service",
    "tasks-service",
    "notes-service",
    "tags-service",
    "categories-service-dotnet",
    "user-profile-service",
    "search-service",
    "logs-service-java",
    "rabbitmq",
    "redis"
  ]
}

variable "alb_ingress_controller_version" {
  description = "AWS Load Balancer Controller Helm chart version"
  type        = string
  default     = "1.9.2"
}

variable "metrics_server_chart_version" {
  description = "Metrics Server Helm chart version"
  type        = string
  default     = "3.12.1"
}

variable "tags" {
  description = "Global tags"
  type        = map(string)
  default     = {}
}
