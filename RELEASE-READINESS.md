# Node SDK release readiness

The 0.1.0 package is an unpublished release candidate in this checkout.

## Prepared

- Sandbox business-wallet transfers follow the current API contract.
- HTTP 200 error envelopes preserve status_code for typed errors.
- Incoming transfer responses and transfer.received signatures have regression tests.
- Windows-only direct Rollup dependency removed for Linux installation.
- CI checks Node 22 and 24. Release publishing runs tests, type checking and build.

## Before publication

1. Create/connect the intended GitHub repository; this checkout has no origin.
2. Commit the SDK sources, tests, lockfile, documentation and workflows.
3. Configure npm trusted publishing for the actual owner/repository and npm-publish.yml.
4. Verify package ownership and first-publication requirements on npm.
5. Resolve the live API banks returning sandbox data, and repeat sandbox integration checks.
6. Publish a GitHub release whose v-prefixed tag matches package.json only after checks pass.

No npm publication or live money movement is performed by local unit tests.
