# Read tail latency from a mergeable distribution
@lesson mergeable-latency-percentiles | Combine observation counts at common latency boundaries and explain when a p95 is only a bound.
@chart Requests at or below each threshold | %
@value 100 ms | 700/1000
@value 250 ms | 940/1000
@value 500 ms | 990/1000
@value 1,000 ms | 1000/1000
@match p95 | p99 | percentile | tail latency | histogram | latency distribution
@source Prometheus · Histograms and summaries | https://prometheus.io/docs/practices/histograms/
@source OpenTelemetry · Metrics data model | https://opentelemetry.io/docs/specs/otel/metrics/data-model/

## Count the distribution

In a 1,000-request example, the cumulative histogram places 700 at or below 100 ms, 940 at or below 250 ms, and 990 at or below 500 ms. The 950th sorted observation lies above 250 ms and at or below 500 ms. Without finer measurements, the p95 lies in that interval. Treat a quantile interpolated inside a bucket as an estimate with resolution limited by the buckets.

## Merge the counts

Averaging p95s across instances gives each instance one vote whether it served 5 requests or 5 million. Sum matching cumulative buckets for the same scoped interval, then estimate the overall quantile. Separate request classes when they have different objectives. Keep the handling of failed and timed-out calls explicit, or the reported p95 can improve as more slow calls fail and disappear from the successful sample.

If the service objective is 95% within 250 ms, a boundary at 250 ms reports the relevant observable directly: 940/1,000, or 94%. You can evaluate it without estimating a percentile between buckets. Validate units and metric reset handling at the instrumentation boundary.

## Limits of the example

The input counts are illustrative. Client and server clocks may describe different intervals. With lower traffic, a few requests can move the reported percentile substantially. Avoid merging distributions with incompatible bucket boundaries or different outcome policies.

# Calculate the cost of saturation with a queue model
@lesson queue-saturation-model | Use a simple queue to understand how waiting grows near capacity, and identify where the assumptions break.
@chart Expected response time at fixed capacity | ms
@value 50 requests/s | 20
@value 80 requests/s | 50
@value 90 requests/s | 100
@value 95 requests/s | 200
@match queueing | utilization | utilisation | little s law | saturation | service rate | capacity planning
@source MIT OpenCourseWare · Queuing models | https://ocw.mit.edu/courses/1-203j-logistical-and-transportation-planning-methods-fall-2006/pages/lecture-notes/

## State the model

An M/M/1 queue has one server, Poisson arrivals, exponential service times, and a steady state when arrival rate λ is below service rate μ. With μ fixed at 100 jobs per second, its mean end-to-end time is 1/(μ−λ). At 50 jobs/s, the result is 20 ms. At 80, 90, and 95 jobs/s, it is 50, 100, and 200 ms. At 80 jobs/s the average service time remains 10 ms and expected waiting is 40 ms.

## Connect it to a measurement

Measure arrival rate at the queue boundary and estimate service time without waiting. Check whether concurrency constraints actually make this resemble one worker. Separate the proportion of slow work and bursts. Export the distribution of in-flight work and downstream wait rather than inferring everything from CPU. Add an explicit overload action at the point where the service can no longer meet its latency objective.

Under steady state, Little's Law relates the mean number in the system to arrival rate × mean time in the system. At 80 requests/s and 0.05 s that gives four requests in the end-to-end system, including service. Match the population before comparing this to a gauge.

## Limits of the example

The model describes a simplified stationary queue and mean time. It does not directly predict a production p99. Heavy tails, bursty arrivals, pools, retries, and autoscaling can move observed results. Validate the knee with a controlled load ramp.

# Test capacity with a load generator that keeps time
@lesson open-loop-load-test | Keep offered load independent of responses so a stalled system cannot make the test appear healthier.
@chart Requests observed during a five-second stall | requests
@value Intended arrivals | 500
@value Serial client completions | 0
@value Open-loop arrivals | 500
@match load test | backpressure | throughput | performance test | concurrency | benchmark
@source Grafana k6 · Open and closed workload models | https://grafana.com/docs/k6/latest/using-k6/scenarios/concepts/open-vs-closed/
@source Google SRE Workbook · Managing load | https://sre.google/workbook/managing-load/

## Compare what the clients send

Suppose intended traffic is 100 arrivals/s and the endpoint stalls for five seconds. The target workload includes 500 arrivals during that stall. A single serial client waiting on one outstanding request reports zero completed responses during those five seconds and does not send the remaining scheduled arrivals. A generator configured to preserve the arrival schedule attempts all 500. Confirm the generator itself can sustain that schedule.

## Make the decision falsifiable

Run a warm-up, stable load, step increase, and sustained recovery. Preserve the workload mix and watch both offered and accepted load. Record successes, queuing, timeouts, and rejected requests on the same clock. The generator must report dropped or late iterations rather than silently omitting them. Observe the service after load falls to check whether queues and retries persist.

A capacity claim should state what got completed under a defined latency target. If 8,900 of 10,000 offers complete within the objective, the success fraction is 89%. The achieved p95 of completed requests alone cannot explain missing work. Include the rejected and unfinished paths in the report.

## Limits of the example

The graph illustrates one stall and two workload models. A closed model is appropriate for some real users whose next action truly depends on the response. Choose the model that matches the question. In either case keep generator saturation, client timeouts, and request generation visible.
