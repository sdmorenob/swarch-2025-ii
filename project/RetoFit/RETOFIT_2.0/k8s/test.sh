#!/bin/bash

#######################################################################
# RetoFit 2.0 - Post-Deployment Test Script
# Valida que todos los componentes estén funcionando correctamente
#######################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

#######################################################################
# Helper Functions
#######################################################################

print_header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_test() {
    echo -e "${CYAN}🧪 TEST: $1${NC}"
}

pass_test() {
    echo -e "${GREEN}  ✅ PASS: $1${NC}"
    ((TESTS_PASSED++))
    ((TESTS_TOTAL++))
}

fail_test() {
    echo -e "${RED}  ❌ FAIL: $1${NC}"
    ((TESTS_FAILED++))
    ((TESTS_TOTAL++))
}

warn_test() {
    echo -e "${YELLOW}  ⚠️  WARN: $1${NC}"
}

#######################################################################
# Test Functions
#######################################################################

test_cluster_connection() {
    print_header "🔌 Testing Cluster Connection"

    print_test "Cluster accessible"
    if kubectl cluster-info >/dev/null 2>&1; then
        pass_test "Cluster is accessible"
    else
        fail_test "Cannot connect to cluster"
        return
    fi

    print_test "Cluster nodes ready"
    local ready_nodes=$(kubectl get nodes --no-headers | grep -c " Ready " || echo "0")
    local total_nodes=$(kubectl get nodes --no-headers | wc -l)

    if [ "$ready_nodes" -eq "$total_nodes" ]; then
        pass_test "All nodes ready ($ready_nodes/$total_nodes)"
    else
        fail_test "Only $ready_nodes/$total_nodes nodes ready"
    fi

    echo ""
}

test_pods_status() {
    print_header "📦 Testing Pods Status"

    print_test "All pods running"
    local total_pods=$(kubectl get pods --no-headers | wc -l)
    local running_pods=$(kubectl get pods --no-headers | grep -c "Running" || echo "0")

    if [ "$running_pods" -eq "$total_pods" ]; then
        pass_test "All pods running ($running_pods/$total_pods)"
    else
        fail_test "Only $running_pods/$total_pods pods running"
        kubectl get pods | grep -v "Running" | grep -v "NAME"
    fi

    print_test "All pods ready"
    local ready_pods=$(kubectl get pods --no-headers | grep -c "1/1" || echo "0")

    if [ "$ready_pods" -eq "$total_pods" ]; then
        pass_test "All pods ready ($ready_pods/$total_pods)"
    else
        fail_test "Only $ready_pods/$total_pods pods ready"
    fi

    # Test specific deployments
    local deployments=(
        "auth-service:2"
        "users-service:2"
        "activities-service:2"
        "gamification-service:1"
        "posts-service:1"
        "admin-service:1"
        "api-gateway:1"
        "nginx-proxy:1"
        "landing-page:1"
        "frontend:1"
    )

    for deployment_info in "${deployments[@]}"; do
        IFS=':' read -r name expected_replicas <<< "$deployment_info"

        print_test "Deployment $name has $expected_replicas replicas"
        local actual_replicas=$(kubectl get deployment "$name" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")

        if [ "$actual_replicas" -eq "$expected_replicas" ]; then
            pass_test "$name has $expected_replicas/$expected_replicas replicas ready"
        else
            fail_test "$name has $actual_replicas/$expected_replicas replicas ready"
        fi
    done

    echo ""
}

test_services() {
    print_header "🌐 Testing Services"

    print_test "LoadBalancer service exists"
    if kubectl get service nginx-proxy >/dev/null 2>&1; then
        pass_test "nginx-proxy service exists"

        local lb_type=$(kubectl get service nginx-proxy -o jsonpath='{.spec.type}')
        if [ "$lb_type" == "LoadBalancer" ]; then
            pass_test "nginx-proxy is type LoadBalancer"
        else
            fail_test "nginx-proxy is not LoadBalancer (found: $lb_type)"
        fi
    else
        fail_test "nginx-proxy service not found"
    fi

    print_test "All backend services exist"
    local backend_services=(
        "auth-service:8001"
        "users-service:8004"
        "activities-service:8002"
        "gamification-service:8003"
        "posts-service:8005"
        "admin-service:8006"
    )

    for service_info in "${backend_services[@]}"; do
        IFS=':' read -r service_name port <<< "$service_info"

        if kubectl get service "$service_name" >/dev/null 2>&1; then
            local service_port=$(kubectl get service "$service_name" -o jsonpath='{.spec.ports[0].port}')

            if [ "$service_port" -eq "$port" ]; then
                pass_test "$service_name on port $port"
            else
                fail_test "$service_name on wrong port (expected: $port, found: $service_port)"
            fi
        else
            fail_test "$service_name not found"
        fi
    done

    print_test "Users service has gRPC port"
    local grpc_port=$(kubectl get service users-service -o jsonpath='{.spec.ports[?(@.name=="grpc")].port}' 2>/dev/null || echo "")

    if [ "$grpc_port" == "50051" ]; then
        pass_test "users-service has gRPC port 50051"
    else
        fail_test "users-service missing gRPC port 50051"
    fi

    echo ""
}

test_endpoints() {
    print_header "🔗 Testing Service Endpoints"

    local services=(
        "auth-service:2"
        "users-service:2"
        "activities-service:2"
        "api-gateway:1"
    )

    for service_info in "${services[@]}"; do
        IFS=':' read -r service_name expected_endpoints <<< "$service_info"

        print_test "$service_name has $expected_endpoints endpoints"
        local endpoint_count=$(kubectl get endpoints "$service_name" -o jsonpath='{.subsets[0].addresses[*].ip}' 2>/dev/null | wc -w)

        if [ "$endpoint_count" -eq "$expected_endpoints" ]; then
            pass_test "$service_name has $expected_endpoints endpoints"
        else
            warn_test "$service_name has $endpoint_count endpoints (expected: $expected_endpoints)"
        fi
    done

    echo ""
}

test_configmaps_secrets() {
    print_header "🔒 Testing ConfigMaps & Secrets"

    print_test "ConfigMaps exist"
    local expected_configmaps=("nginx-config" "api-gateway-config")

    for cm in "${expected_configmaps[@]}"; do
        if kubectl get configmap "$cm" >/dev/null 2>&1; then
            pass_test "ConfigMap $cm exists"
        else
            fail_test "ConfigMap $cm not found"
        fi
    done

    print_test "Secrets exist"
    local expected_secrets=(
        "jwt-secret"
        "database-secrets"
        "mongodb-secret"
        "smtp-secret"
        "cloudinary-secret"
        "firebase-secret"
        "gemini-secret"
        "nginx-tls-secret"
    )

    for secret in "${expected_secrets[@]}"; do
        if kubectl get secret "$secret" >/dev/null 2>&1; then
            pass_test "Secret $secret exists"
        else
            fail_test "Secret $secret not found"
        fi
    done

    echo ""
}

test_connectivity() {
    print_header "🔌 Testing Pod Connectivity"

    print_test "API Gateway can reach auth-service"
    if kubectl exec deployment/api-gateway -- curl -s -m 5 http://auth-service:8001/ >/dev/null 2>&1; then
        pass_test "API Gateway → auth-service connectivity OK"
    else
        fail_test "API Gateway cannot reach auth-service"
    fi

    print_test "API Gateway can reach users-service"
    if kubectl exec deployment/api-gateway -- curl -s -m 5 http://users-service:8004/ >/dev/null 2>&1; then
        pass_test "API Gateway → users-service connectivity OK"
    else
        fail_test "API Gateway cannot reach users-service"
    fi

    print_test "Activities service can reach users-service gRPC"
    if kubectl exec deployment/activities-service -- nc -zv users-service 50051 2>&1 | grep -q "succeeded\|open"; then
        pass_test "Activities → Users gRPC connectivity OK"
    else
        warn_test "Cannot verify gRPC connectivity (nc may not be available)"
    fi

    echo ""
}

test_external_access() {
    print_header "🌐 Testing External Access"

    # Get LoadBalancer IP
    local lb_ip=$(kubectl get service nginx-proxy -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")

    if [ -z "$lb_ip" ]; then
        lb_ip="localhost"
        warn_test "LoadBalancer IP not assigned, using localhost"
    fi

    print_test "Nginx health endpoint accessible"
    if curl -k -s -m 5 "https://${lb_ip}/nginx-health" | grep -q "healthy"; then
        pass_test "Nginx health check OK"
    else
        warn_test "Cannot reach Nginx health endpoint (may need 'minikube tunnel')"
    fi

    print_test "Landing page accessible"
    if curl -k -s -m 5 "https://${lb_ip}/" | grep -q "html"; then
        pass_test "Landing page accessible"
    else
        warn_test "Cannot reach landing page"
    fi

    echo ""
}

test_database_connectivity() {
    print_header "💾 Testing Database Connectivity"

    print_test "Auth service can connect to PostgreSQL"
    if kubectl logs -l app=auth-service --tail=50 2>/dev/null | grep -qi "connected\|success" && \
       ! kubectl logs -l app=auth-service --tail=50 2>/dev/null | grep -qi "database.*error\|connection.*failed"; then
        pass_test "Auth service DB connection OK"
    else
        warn_test "Cannot verify auth service DB connection"
    fi

    print_test "Gamification service can connect to MongoDB"
    if kubectl logs -l app=gamification-service --tail=50 2>/dev/null | grep -qi "connected\|mongo" && \
       ! kubectl logs -l app=gamification-service --tail=50 2>/dev/null | grep -qi "mongodb.*error\|connection.*failed"; then
        pass_test "Gamification service MongoDB connection OK"
    else
        warn_test "Cannot verify gamification service MongoDB connection"
    fi

    echo ""
}

test_load_balancing() {
    print_header "⚖️  Testing Load Balancing"

    print_test "Auth service has multiple replicas"
    local auth_replicas=$(kubectl get deployment auth-service -o jsonpath='{.status.readyReplicas}')

    if [ "$auth_replicas" -ge 2 ]; then
        pass_test "Auth service has $auth_replicas replicas (load balancing enabled)"

        print_test "Requests distributed across auth pods"
        # This is informational, not a pass/fail test
        local pod_names=$(kubectl get pods -l app=auth-service -o jsonpath='{.items[*].metadata.name}')
        warn_test "Auth pods: $pod_names"
    else
        fail_test "Auth service has only $auth_replicas replica (load balancing disabled)"
    fi

    echo ""
}

test_resource_limits() {
    print_header "📊 Testing Resource Limits"

    print_test "Deployments have resource limits defined"
    local deployments=$(kubectl get deployments -o name | wc -l)
    local with_limits=$(kubectl get deployments -o jsonpath='{range .items[*]}{.metadata.name}{" "}{.spec.template.spec.containers[0].resources.limits}{"\n"}{end}' | grep -c "map\|Mi" || echo "0")

    if [ "$with_limits" -ge $((deployments - 1)) ]; then
        pass_test "$with_limits/$deployments deployments have resource limits"
    else
        warn_test "Only $with_limits/$deployments deployments have resource limits"
    fi

    echo ""
}

#######################################################################
# Summary Report
#######################################################################

print_summary() {
    print_header "📋 Test Summary"

    local pass_rate=0
    if [ "$TESTS_TOTAL" -gt 0 ]; then
        pass_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    fi

    echo -e "${CYAN}Total Tests: ${TESTS_TOTAL}${NC}"
    echo -e "${GREEN}Passed:      ${TESTS_PASSED}${NC}"
    echo -e "${RED}Failed:      ${TESTS_FAILED}${NC}"
    echo -e "${CYAN}Pass Rate:   ${pass_rate}%${NC}"
    echo ""

    if [ "$TESTS_FAILED" -eq 0 ]; then
        echo -e "${GREEN}✅ All tests passed! Deployment is healthy.${NC}"
    elif [ "$pass_rate" -ge 80 ]; then
        echo -e "${YELLOW}⚠️  Most tests passed. Some warnings detected.${NC}"
    else
        echo -e "${RED}❌ Multiple tests failed. Please investigate.${NC}"
    fi

    echo ""
}

#######################################################################
# Main Execution
#######################################################################

main() {
    clear

    echo -e "${BLUE}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              🧪 KUBERNETES TEST SUITE 🧪                 ║
║                                                           ║
║                    RetoFit 2.0 - v1.0                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    test_cluster_connection
    test_pods_status
    test_services
    test_endpoints
    test_configmaps_secrets
    test_connectivity
    test_external_access
    test_database_connectivity
    test_load_balancing
    test_resource_limits
    print_summary
}

main
