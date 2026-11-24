---
title: "Kubernetes Fundamentals: What It Is, What It Does, and When You Actually Need It"
description: "Pods, Deployments, Services, ConfigMaps, and the control loop that keeps your containers running. The honest introduction to Kubernetes for engineers who want to understand it, not just use it."
date: 2025-12-02
tags: ["DevSecOps", "Cloud Architecture", "Fundamentals"]
series: "Containerization from the Ground Up"
seriesOrder: 4
format: article
---

Kubernetes is a container orchestration platform. That description is accurate and tells you very little about what it actually does. A more useful description: Kubernetes is a system that continuously compares the state you want (declared in YAML files) with the state that actually exists (running containers, network rules, storage volumes) and makes changes to close the gap.

## What to measure

**Scheduling headroom after losing a node.** If workloads request 18 vCPU and the remaining nodes have 20 allocatable vCPU after one node is drained, the aggregate margin is 2 vCPU. Check memory, topology and pod placement too; aggregate headroom can coexist with an unschedulable pod.

*Illustrative measurement. Any numbers in this example are hypothetical.*

The [2025 CNCF survey](https://www.cncf.io/announcements/2026/01/20/kubernetes-established-as-the-de-facto-operating-system-for-ai-as-production-use-hits-82-in-2025-cncf-annual-cloud-native-survey/) reports production Kubernetes use among 82% of container users in its survey. That figure describes this cohort; cluster sizing still depends on your workloads.

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
    metadata:
      labels:
        app: my-api
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

Kubernetes controllers continuously watch the actual state. If a node fails and one pod is lost, the controller creates a replacement. If you update the image version, the controller rolls out the change incrementally. If a container exits, the kubelet restarts it according to the Pod's restart policy. You do not manage this directly — you declare what you want, and Kubernetes maintains it.

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

## Follow one deployment through its owners

A deployment request passes through several independently observable transitions. The API must accept the object before any controller can act. The Deployment controller manages a ReplicaSet, the ReplicaSet manages Pods, the scheduler assigns eligible Pods to nodes, and the kubelet drives container startup. Give each transition a named source of evidence. This prevents a generic statement like “Kubernetes is down” from delaying a handoff to the team that owns the current failure. [Kubernetes Deployment controller](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)

| Transition | Evidence to look for | Question when it stalls |
| --- | --- | --- |
| Desired revision recorded | Deployment template and generation | Did the API accept the expected configuration? |
| New Pods created | ReplicaSet revision and Pod ownership | Did the controller observe the change? |
| Pod assigned to a node | Scheduling condition and events | Can a candidate node satisfy its requests and placement constraints? |
| Container runs | Pull and startup events, current container status | Was the image available and did the process start? |
| Workload eligible for traffic | Readiness and matching Service endpoints | Is the app ready for traffic on the selected port? |

Start with a server-side dry run of a manifest in the intended cluster and namespace before trying to measure any runtime behavior. The Pod template in the earlier Deployment example needs matching app labels under the template metadata to satisfy the Deployment selector. An accepted manifest then gives a reproducible starting point for the lifecycle checks. Record revision and Pod identifier when handing off logs because a replacement may take the failed Pod's place.

## Give startup, readiness, and liveness different jobs

A startup check gives a slow process time to become initialized before other probes run. A readiness check determines whether traffic should be routed to an instance. A liveness check can trigger a restart after repeated failures. Kubernetes configures these behaviors separately. Treat a progress alarm such as a failed readiness check as a question about service capacity. A restart is a different response with a cost. [Kubernetes application probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/)

For an illustrative startup profile, a service takes 15 seconds during a warm start and 55 seconds after a cold pull once the process starts. A startup probe scheduled every 5 seconds with 15 allowed consecutive failures gives a nominal interval budget of about 75 seconds. Actual timing depends on probe scheduling, startup delay, and timeout. In a disposable environment, verify both that a 55-second initialization becomes ready and that a deliberately unresponsive startup eventually restarts. Measure the pull separately because the container process cannot answer probes during an image pull.

Check readiness by making one replica report temporarily unavailable and observing endpoint eligibility and the request success rate from a synthetic client. Test liveness separately with a fixture that stops handling its own work until restarted. A transient dependency loss shared by all replicas should have an explicit readiness strategy. If it also triggers liveness failures, every instance may restart together while the dependency is still unavailable. Rehearse the dependency failure and inspect whether the planned degraded response stays available.

## Budget a rollout for capacity and behavior

A rolling update limits the balance of old and new Pods through its surge and unavailability options. A zero unavailability setting with one surge replica allows replacement to proceed while preserving the desired count of available Pods, provided the new replica can be scheduled and become available. Derive the necessary headroom from the new workload's actual requests and placement rules. [Kubernetes Deployment rolling updates](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-update-deployment)

Consider a synthetic deployment with four replicas. Each old Pod requests 500m CPU and 384 MiB of memory. Each new Pod requests 750m and 512 MiB. The steady-state request totals rise from 2 vCPU and 1,536 MiB to 3 vCPU and 2,048 MiB. Late in the rollout, four new Pods and one old Pod may overlap. Their combined request is 3.5 vCPU and 2,432 MiB, before workload sidecars or Pod overhead. Terminating Pods can temporarily increase resource use even after a replacement starts. Treat these numbers as planning inputs, then observe actual placement and capacity during the drill.

Run a small synthetic workload through the Service during the rollout. Log errors, request duration, and an application behavior that the new image could change. Watch the rollout status and progress deadline. A progressed or complete Deployment is control-plane evidence. Include application evidence in both the rollout decision and the rollback decision. A workload rollback changes the Pod template. A schema or durable data change needs its own compatibility plan.

## Select the smallest operating model your team can rehearse

Compare options using one real delivery requirement. Ask teams to push a configuration-only change, replace a failed instance, see the incident in logs, and roll back a release while meeting their latency and recovery objectives. Record operator minutes, delayed work, required privileges, and the number of teams paged. An alternative hosting model may already satisfy the exercise. A managed Kubernetes service changes which control-plane activities are owned by the provider, and the team still has to account for workloads, access, cost, and data recovery.

Keep one review record per workload with its owner, deployment trigger, scaling signal, traffic entry point, state dependencies, and recovery target. Repeat the drill when the architecture changes. The outcome gives the team a basis for choosing whether Kubernetes scheduling and rollout flexibility repay the work of operating those resources.
