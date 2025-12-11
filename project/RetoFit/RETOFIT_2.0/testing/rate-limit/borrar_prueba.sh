kubectl delete -f prometheus.yaml
kubectl delete -f grafana.yaml
kubectl delete configmap k6-scripts
kubectl delete -f k6-prometheus-job.yaml