# Terraform - Infraestructura AWS para TaskNotes

Este stack crea VPC, EKS, ALB Ingress Controller, Metrics Server, ECRs y (opcional) certificado ACM. Ajusta variables en `terraform.tfvars` antes de aplicar.

## Estructura
- `providers.tf`: proveedores y versiones requeridas.
- `variables.tf`: parámetros de región, red, dominio, ECR, versiones de charts.
- `main.tf`: VPC, EKS (IRSA + addons), ALB Controller, Metrics Server, ECR, ACM opcional.
- `outputs.tf`: ARN/IDs clave para enlazar con los manifiestos K8s.

## Variables mínimas sugeridas (`terraform.tfvars`)
```hcl
aws_region        = "us-east-1"
cluster_name      = "tasknotes-eks"
kubernetes_version = "1.29"
domain_name       = "example.com"
hosted_zone_id    = "Z123EXAMPLE"
single_nat_gateway = true
node_instance_types = ["t3.medium"] # más recursos; ajusta tamaños si quieres ahorrar
node_desired_size = 3
node_min_size     = 2
node_max_size     = 6
# ecr_repositories puede ajustarse si cambian los servicios
```

Si no tienes dominio/Zona en Route53, deja `domain_name` y `hosted_zone_id` vacíos; el certificado no se crea y deberás poner el ARN manualmente en los Ingress.

## Uso rápido
```bash
cd terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

## Notas
- IRSA está habilitado; ALB Controller y EBS CSI driver usan el OIDC del cluster.
- Metrics Server se despliega vía Helm para habilitar HPAs.
- ECR repos incluyen política de retención (últimas 15 imágenes) y scan-on-push.
- VPC usa subnets públicas (para ALB) y privadas (nodos); `single_nat_gateway` reduce costo, cámbialo a `false` para alta disponibilidad por AZ.
