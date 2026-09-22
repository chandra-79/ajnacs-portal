---
title: "Kubernetes Fundamentals: What It Is, What It Does, and When You Actually Need It"
description: "Pods, Deployments, Services, ConfigMaps, and the control loop that keeps your containers running. The honest introduction to Kubernetes for engineers who want to understand it, not just use it."
date: 2026-06-29
tags: ["DevSecOps", "Cloud Architecture", "Fundamentals"]
series: "Containerization from the Ground Up"
seriesOrder: 4
format: article
---

Kubernetes is a container orchestration platform. That description is accurate and tells you very little about what it actually does. A more useful description: Kubernetes is a system that continuously compares the state you want (declared in YAML files) with the state that actually exists (running containers, network rules, storage volumes) and makes changes to close the gap.

## The Core Concept: Desired State and the Control Loop

You tell Kubernetes what you want. Kubernetes figures out how to achieve it and maintains it.

```yaml
## You declare: I want 3 replicas of my API running
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-api
spec:
  replicas: 3          # desired state: 3 pods
  selector:
    matchLabels:
      app: my-api
  template:
    spec:
      containers:
      - name: my-api
        image: my-api:v1.2.3
        resources:
          requests:
            cpu: "250m"
            memory: "256Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
```

Kubernetes controllers continuously watch the actual state. If a node fails and one pod is lost, the controller creates a replacement. If you update the image version, the controller rolls out the change incrementally. If a container crashes, the controller restarts it. You do not manage this directly — you declare what you want, and Kubernetes maintains it.

## The Building Blocks

**Pod**: the smallest deployable unit. One or more containers sharing a network namespace and storage. In practice, most pods run one container. Pods are ephemeral — when a pod dies, its IP address is gone.

**Deployment**: manages a set of identical pods. Handles rolling updates, rollbacks, and scaling. This is how you run stateless applications.

**Service**: a stable network endpoint for a set of pods. Pods come and go; the Service IP and DNS name remain constant. Kubernetes' kube-proxy maintains iptables (or eBPF) rules that route traffic from the Service IP to any healthy pod that matches the Service's selector.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-api
spec:
  selector:
    app: my-api        # routes to pods with this label
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP      # internal only; LoadBalancer for external access
```

**ConfigMap**: key-value configuration data, injected as environment variables or mounted as files. Separates configuration from the container image.

**Secret**: like ConfigMap, but for sensitive data. Base64-encoded (not encrypted in etcd by default — encryption at rest requires configuration).

**PersistentVolume / PersistentVolumeClaim**: storage that persists beyond the pod lifecycle. Required for stateful applications (databases, message queues).

**Ingress**: routes HTTP/HTTPS traffic from outside the cluster to internal Services, based on hostname and path rules.

## The Control Plane

Kubernetes has a control plane (which manages the cluster) and worker nodes (which run workloads).

**Control plane components**:
- **etcd**: the distributed key-value store that holds all cluster state. Every object you create is stored here.
- **API server**: the REST API that every other component (and every user) talks to.
- **Scheduler**: assigns new pods to nodes based on resource requests, node capacity, and scheduling constraints.
- **Controller manager**: runs the control loops that maintain desired state (Deployment controller, Node controller, etc.).

**Worker node components**:
- **kubelet**: runs on every node. Watches the API server for pods assigned to its node and ensures those pods are running.
- **kube-proxy**: maintains network rules on each node for Services.
- **Container runtime**: containerd or CRI-O — runs the actual containers.

## Basic Operations

```bash
## Apply a configuration
kubectl apply -f deployment.yaml

## Check what is running
kubectl get pods
kubectl get pods -o wide              # includes node and IP
kubectl get deployments
kubectl get services

## Describe a resource (events, conditions, full spec)
kubectl describe pod my-api-7d4f8c9b6-xk2np

## Logs
kubectl logs my-api-7d4f8c9b6-xk2np
kubectl logs -f my-api-7d4f8c9b6-xk2np   # follow
kubectl logs my-api-7d4f8c9b6-xk2np --previous  # crashed container

## Execute a command inside a running pod
kubectl exec -it my-api-7d4f8c9b6-xk2np -- /bin/sh

## Scale a deployment
kubectl scale deployment my-api --replicas=5

## Roll out an update
kubectl set image deployment/my-api my-api=my-api:v1.2.4
kubectl rollout status deployment/my-api
kubectl rollout undo deployment/my-api   # rollback
```

## When You Actually Need Kubernetes

Kubernetes is operationally complex. The right question before adopting it:

**Use Kubernetes when**: you have multiple teams deploying independent services with independent scaling requirements, you need automated rollouts and rollbacks, you need cluster-level resource scheduling, or you are building on a managed Kubernetes service (EKS, AKS, GKE) where the control plane complexity is abstracted away.

**Consider alternatives when**: you have one or two services, a small team, and weekly deployments. ECS with Fargate, Cloud Run, or Azure Container Apps handle container orchestration without the Kubernetes operational surface. The tradeoff is less flexibility for significantly lower complexity.

The final lesson in this series covers container security — the specific configurations that determine whether your container workloads are a manageable attack surface or an unnecessary liability.
