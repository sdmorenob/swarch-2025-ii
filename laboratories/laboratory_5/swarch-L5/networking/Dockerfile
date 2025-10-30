# Start from the latest Ubuntu LTS
FROM ubuntu:25.10

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Update and install networking tools
RUN apt-get update && apt-get install -y \
    net-tools iproute2 netcat-openbsd dnsutils curl iputils-ping iptables nmap tcpdump telnet traceroute \
    openssl ca-certificates gnutls-bin \
    && rm -rf /var/lib/apt/lists/*

# Default command: open a shell
CMD ["/bin/bash"]