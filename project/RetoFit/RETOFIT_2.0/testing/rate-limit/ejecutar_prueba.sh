kubectl apply -f prometheus.yaml
kubectl apply -f grafana.yaml
kubectl create configmap k6-scripts --from-file=scripts/k6_rate_limit_test.js --namespace=default
kubectl apply -f k6-prometheus-job.yaml

kubectl wait --for=condition=ready pod -l job=k6-prometheus --timeout=180s

kubectl logs -f job/k6-prometheus