# Sandboxed Soplang execution service.
#
# SECURITY: this container executes arbitrary, untrusted user code. It MUST
# be run with no outbound network access (e.g. `docker run --network none`,
# or the equivalent egress-deny policy on your platform) and with resource
# caps set on the container itself (memory, CPU, pids) in addition to the
# per-execution limits enforced in server.js. See README.md before deploying.

ARG SOPLANG_REF=v2.0.0

FROM node:20-bookworm-slim
ARG SOPLANG_REF

# util-linux provides prlimit (OS-enforced CPU/memory/process caps);
# python3 runs the vendored interpreter; git fetches it at build time.
RUN apt-get update && apt-get install -y --no-install-recommends \
      util-linux python3 git ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --no-create-home --uid 10001 runner

WORKDIR /app
COPY server.js run_soplang.py package.json ./

RUN git clone --depth 1 --branch ${SOPLANG_REF} \
      https://github.com/soplang/soplang.git /app/vendor/soplang \
    && rm -rf /app/vendor/soplang/.git

ENV PORT=8080
ENV PYTHON_BIN=python3
ENV SOPLANG_SRC_DIR=/app/vendor/soplang
EXPOSE 8080

USER runner
CMD ["node", "server.js"]
