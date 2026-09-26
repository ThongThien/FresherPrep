# SECURITY AUDIT RESULT — JOB 36

Ngày audit: 2026-09-26  
Phạm vi: source code và môi trường local của FresherPrep tại thời điểm audit.

## Final Security Decision

**SECURITY TEST BLOCKED**

Production blocker còn lại: tài khoản PostgreSQL runtime được kiểm tra trong môi trường hiện tại có quyền
`CREATEROLE`, `CREATEDB` và `BYPASSRLS`. Chưa được phép dùng credential này để chạy production.
Script review-only để tạo runtime role tối thiểu có tại
`docs/security/database-least-privilege.sql`; script chưa được tự động thực thi.

Không phát hiện Critical. Các High khác trong phạm vi đã kiểm tra đã được sửa và retest.
Kết luận này không có nghĩa ứng dụng “100% secure”.

## Testing mode và giới hạn

- Black-box: HTTP/API công khai, preflight CORS, security headers, auth failures và BFF origin check trên local.
- Gray-box: request trực tiếp bằng test USER và ADMIN; ownership của quiz attempt; role authorization; refresh rotation/revocation; stale JWT.
- White-box: trace Controller → Security → Service → Repository → database; frontend/BFF; DTO/validation; cache; Docker; CI/CD; Git history và dependency manifests.
- Controlled/rate-limited: không DDoS, không brute force vô hạn, không đọc/xuất business data ngoài lượng tối thiểu cần xác minh.
- CONTRIBUTOR không có test account được cấp: contributor được white-box audit, chưa có gray-box runtime.
- In-app browser không khả dụng trong environment; black-box UI được giới hạn ở HTTP/runtime headers, không khẳng định visual E2E.
- Không có quyền truy cập VPS, Nginx, DNS, TLS certificate, firewall hoặc production secret store.
- Docker client có nhưng daemon không chạy; chưa build/scan image runtime.
- Standalone backend với profile prod không khởi động lại được vì Supabase session pool đã đạt giới hạn client; prod config được build/audit nhưng Swagger/health prod chưa retest runtime.
- npm advisory audit chạy được. Maven dependency resolution chạy được, nhưng external advisory lookup không chạy được do giới hạn tool/network.

## Technology

- Frontend: Next.js 16.3.6 App Router, React 19.2.8, Tailwind CSS 4.
- Backend: Java 21, Spring Boot 4.1.1, Spring Security/OAuth2 Resource Server, JPA/Hibernate, Validation, Actuator.
- Database: Supabase PostgreSQL 17.6 qua session pooler, TLS required.
- Cache: Redis optional cho public/published DTO; không thấy user-specific cache key.
- Authentication: bearer JWT access token; refresh token rotation/revocation; BFF lưu token trong HttpOnly cookie.
- Container/CI: backend Dockerfile; GitHub Actions deploy Docker image tới VPS.

## Asset inventory

| Asset | Status |
|---|---|
| Frontend, BFF, backend API | APPLICABLE — audited |
| PostgreSQL/Supabase | APPLICABLE — metadata/privilege audit |
| Admin/User/Contributor areas | APPLICABLE — USER/ADMIN runtime, CONTRIBUTOR white-box |
| Redis | APPLICABLE — source/config audit; deployment network not verified |
| Docker, GitHub Actions | APPLICABLE — static audit |
| VPS, reverse proxy, DNS, TLS | PRODUCTION CHECKLIST — environment not accessible |
| File/object storage, upload/download | NOT APPLICABLE |
| Queue | NOT APPLICABLE |
| Webhook | NOT APPLICABLE |
| Server-side URL fetch/SSRF input | NOT APPLICABLE |

## Attack surface

- Auth: register, login, refresh, logout, current user/profile.
- Learning: knowledge, learning paths/join, lessons/progress/completion/assessment.
- Quiz: published quiz, start attempt, attempt detail/history, submit/result.
- Contributor: draft/submission/review workflow.
- Admin: users/roles/status and content management.
- Operational: Actuator health, OpenAPI/Swagger, frontend BFF route handlers.

Endpoint inventory được đối chiếu từ frontend API clients, Next route handlers, Spring controllers và OpenAPI.

## Permission matrix đã xác minh

| Operation | Unauthenticated | USER | ADMIN |
|---|---:|---:|---:|
| Current profile | 401 | 200 own | 200 own |
| Admin user list | 401 | 403 | 200 |
| Contributor endpoints | 401 | 403 | 403 unless contributor role |
| Admin role mutation | 401 | 403 | allowed by endpoint rules |
| Quiz attempt owned by another account | 401 | 404 | 404 unless owner-specific API permits |

Backend authorization được kiểm tra trực tiếp; không dựa vào việc frontend ẩn button/route.

## Findings

### SEC-001 — Runtime database role overprivileged

Finding: Runtime database role có quyền quản trị không cần thiết  
Category: Database least privilege  
Severity: **HIGH — OPEN / PRODUCTION BLOCKER**

Affected component: PostgreSQL/Supabase connection  
Endpoint / file: runtime environment; `fesherprep-api/.env.example`

Attacker: người chiếm được ứng dụng runtime hoặc khai thác được SQL/ORM write primitive  
Precondition: truy cập được credential DB runtime hoặc đạt code execution trong backend

Observed behavior: metadata read-only cho thấy role hiện tại không phải superuser nhưng có
`CREATEROLE=true`, `CREATEDB=true`, `BYPASSRLS=true`; role cũng có CREATE trên schema ứng dụng.
Chỉ 2/21 application tables bật RLS. Không thấy grant cho `anon`, `authenticated` hoặc
`service_role` trên schema `fresherprep`.

Expected behavior: runtime role chỉ CONNECT, USAGE schema và CRUD/sequence cần cho ứng dụng;
không được create role/database, bypass RLS hoặc thay schema trong production.

Security impact: compromise backend có thể mở rộng đáng kể sang database control plane và vô hiệu hóa
defense-in-depth của RLS.

Evidence: truy vấn metadata role/schema/grant; không đọc hoặc xuất business rows.

Root cause: cùng owner-style credential được dùng cho schema administration và runtime.

Recommended fix: review và chạy `docs/security/database-least-privilege.sql` bằng admin account,
đổi production secret sang `fresherprep_runtime`, giữ `ddl-auto=validate`, sau đó thu hồi credential cũ
khỏi runtime. Migration/admin role phải tách riêng.

Retest: xác nhận runtime role có bốn privilege flags false; app start được; CRUD hợp lệ pass; CREATE ROLE,
CREATE DATABASE và CREATE schema/table bị từ chối.

### SEC-002 — Stale JWT giữ quyền sau khi account/role thay đổi

Finding: access token cũ vẫn mang role/active claim tới khi hết hạn  
Category: Authentication/authorization state  
Severity: **HIGH — FIXED**

Affected component: Spring Security bearer authentication  
Endpoint / file: `CurrentUserSecurityFilter`, `SecurityConfiguration`

Attacker: user đã bị khóa hoặc bị hạ quyền nhưng còn access token  
Precondition: token chưa hết hạn

Observed behavior: JWT signature/expiry hợp lệ trước đây đủ để authorize, không đối chiếu active/role hiện tại.

Expected behavior: account bị vô hiệu hóa hoặc role thay đổi phải mất quyền ngay trên request tiếp theo.

Security impact: cửa sổ truy cập trái phép tới tối đa access-token TTL.

Evidence: trace security chain và controlled deactivate/reactivate test account.

Root cause: stateless JWT claims không được đối chiếu với state bảo mật hiện tại.

Recommended fix: filter đã thêm kiểm tra user tồn tại, active và role khớp token trên mọi `/api/*`
authenticated request; trả standardized 401 `SESSION_INVALIDATED`.

Retest: token 200 trước khi deactivate; cùng token trả 401 sau deactivate; account test đã được reactivate.

### SEC-003 — Quiz deadline chỉ được frontend thực thi

Finding: backend nhận đáp án đúng sau deadline  
Category: Business logic / quiz integrity  
Severity: **MEDIUM — FIXED**

Affected component: quiz submit  
Endpoint / file: `QuizAttempt.submit`, `QuizService`

Attacker: authenticated quiz participant  
Precondition: timed attempt đã hết hạn nhưng chưa submit

Observed behavior: `expiresAt` được trả cho UI nhưng submit không từ chối/neutralize late answers.

Expected behavior: server receive time là authority; late answers không ảnh hưởng score.

Security impact: user có thể kéo dài thời gian làm bài bằng direct API request.

Evidence: white-box domain trace và regression test.

Root cause: deadline chỉ phục vụ countdown UI.

Recommended fix: đã finalize attempt tại deadline và bỏ qua toàn bộ selections nhận sau deadline; không thêm
autosave, per-answer request hoặc kiến trúc submission mới.

Retest: late correct answer tạo submitted result score 0; 10 quiz domain tests pass.

### SEC-004 — Auth endpoints không có throttling

Finding: login/register/refresh cho phép request lặp không giới hạn ở application layer  
Category: Rate limiting / abuse prevention  
Severity: **MEDIUM — FIXED WITH RESIDUAL RISK**

Affected component: auth endpoints  
Endpoint / file: `AuthRateLimitFilter`, `AuthRateLimitProperties`

Attacker: unauthenticated remote client  
Precondition: có network access tới API

Observed behavior: controlled repeated failed login trước fix đều trả auth error, không có 429.

Expected behavior: sensitive auth endpoints có request budget nhỏ, bounded memory và 429 rõ ràng.

Security impact: tăng khả năng password guessing, registration spam và resource abuse.

Evidence: controlled runtime requests; không brute force tài khoản thật.

Root cause: chưa có rate limiter tại gateway hoặc application.

Recommended fix: đã thêm fixed-window per-client/per-endpoint; mặc định login 10/min, register 5/min,
refresh 30/min, tối đa 10.000 client keys; trả `Retry-After`.

Retest: request auth thứ 11 trong cửa sổ trả 429.

Residual risk: limiter in-memory và per-instance. Khi scale ngang phải chuyển sang Redis/gateway limiter;
trusted reverse proxy phải overwrite forwarding headers.

### SEC-005 — Secret-like DTO values có thể xuất hiện trong debug log

Finding: request/response record mặc định có thể stringify password/token  
Category: Sensitive data exposure / logging  
Severity: **MEDIUM — FIXED**

Affected component: auth DTO và development logging  
Endpoint / file: Login/Register/Refresh DTO, TokenPairResponse, `application-dev.properties`

Attacker: người đọc được application logs  
Precondition: debug web logging hoặc exception formatter stringify DTO

Observed behavior: validation debug output đã chứa plaintext test password.

Expected behavior: password/access token/refresh token không xuất hiện trong logs.

Security impact: credential/token leakage qua log retention hoặc log platform.

Evidence: controlled local validation log; secret value không được đưa vào report.

Root cause: record `toString()` mặc định và verbose web log level.

Recommended fix: masked `toString()` cho auth DTO/token response; Spring web logging đặt INFO; devtools
property injection tắt ở prod.

Retest: source/config audit và unit/build regression pass.

### SEC-006 — Concurrent start/review có thể tạo trạng thái tranh chấp

Finding: một số state-changing operation thiếu serialization rõ ràng  
Category: Race condition / workflow integrity  
Severity: **LOW — FIXED**

Affected component: quiz start; contributor approve/reject  
Endpoint / file: `UserRepository.findByIdForUpdate`,
`ContentSubmissionRepository.findByIdForUpdate`

Attacker: authenticated user/concurrent reviewer  
Precondition: gửi concurrent requests có chủ đích

Observed behavior: operations đọc state rồi mutate mà không khóa cùng aggregate row.

Expected behavior: concurrent request phải serialize hoặc conflict, không tạo duplicate/inconsistent state.

Security impact: duplicate active attempt hoặc review transition không nhất quán.

Evidence: transaction/repository trace.

Root cause: transaction boundary có nhưng thiếu pessimistic lock tại điểm coordination.

Recommended fix: đã khóa user khi start attempt và submission khi approve/reject. Existing unique constraints,
optimistic version và submit lock tiếp tục bảo vệ các flow khác.

Retest: compilation, mapping context và 29 tests pass. Chưa chạy load/concurrency test bên ngoài process.

### SEC-007 — Production attack-surface hardening chưa đầy đủ

Finding: Swagger prod, optional Redis readiness, container user và browser headers cần hardening  
Category: Production configuration / information disclosure  
Severity: **LOW — FIXED**

Affected component: Spring prod profile, Dockerfile, Next.js  
Endpoint / file: OpenAPI/Swagger, health, frontend responses

Attacker: remote web client  
Precondition: production endpoint accessible

Observed behavior: prod OpenAPI từng public; optional Redis làm health trả 503; image chạy mặc định root;
frontend thiếu policy headers.

Expected behavior: prod docs off; optional cache không quyết định readiness; non-root container; browser
security headers phù hợp.

Security impact: tăng reconnaissance, operational DoS/noise và impact khi container bị compromise.

Evidence: pre-fix local HTTP and static audit.

Root cause: dev defaults được mang sang deployment.

Recommended fix: prod Swagger disabled, Redis health optional, Open Session in View off, non-root Docker user;
Next headers gồm CSP, nosniff, frame denial, referrer/permissions/COOP.

Retest: frontend production server trả các headers mới; frontend build pass. Prod backend runtime retest bị
block bởi Supabase client limit.

Residual risk: CSP còn `unsafe-inline` để tương thích Next/theme bootstrap. HSTS chỉ nên bật tại reverse proxy
sau khi HTTPS toàn domain đã được xác minh.

### SEC-008 — Một số rich content field thiếu upper bound

Finding: request content có thể quá lớn trước khi tới DB/business validation  
Category: Input validation / resource abuse  
Severity: **LOW — FIXED**

Affected component: lesson/question version/options DTO  
Endpoint / file: create/update request DTOs

Attacker: contributor/admin account  
Precondition: quyền tạo/sửa content

Observed behavior: một số text field chỉ có not-blank, không có maximum length.

Expected behavior: backend có upper bound hợp lý độc lập frontend.

Security impact: memory/log/DB abuse và response payload quá lớn.

Evidence: DTO source audit.

Root cause: thiếu Bean Validation size limit.

Recommended fix: đã thêm limits cho lesson content, question/explanation và option content/explanation.

Retest: compile và 29 tests pass.

## Security controls verified

- Password: BCrypt; không lưu plaintext; password hash không xuất hiện trong response DTO.
- Refresh token: chỉ lưu SHA-256 hash; rotation hoạt động; old token reuse và post-logout refresh đều 401.
- JWT: modified signature và invalid token trả 401; access TTL 15 phút.
- Authorization: USER bị 403 ở admin/contributor APIs; method/route checks tồn tại phía backend.
- IDOR/BOLA: cross-account quiz attempt IDs trả 404 trong cả hai hướng USER/ADMIN đã thử.
- Quiz: score/pass được tính server-side; attempt/question version snapshot; ownership; duplicate submit;
fixed/rule-based selection được xử lý backend.
- CSRF: bearer model khác cookie-session truyền thống; BFF state mutations kiểm tra Origin và SameSite=Lax.
Missing Origin vẫn được chấp nhận để hỗ trợ non-browser clients có bearer auth.
- CORS: không wildcard+credentials; hostile origin preflight không được allow.
- SQL/ORM injection: không tìm thấy query nối chuỗi với input; repository queries parameterized.
- Mass assignment: controllers nhận request DTO, không bind trực tiếp entity nhạy cảm.
- XSS: learning content được render bằng React text/custom parser; không thấy raw backend HTML injection.
- Open redirect: return path helper chỉ chấp nhận internal path.
- Cache: chỉ cache public/published generic DTO; không thấy cache user data dùng chung key.
- Secrets: không thấy real secret trong tracked files hoặc sensitive filename history; `.env` ignored.
- Supabase Data API: không thấy grants `anon/authenticated/service_role` trên schema app.

## Status by category

| Category | Result |
|---|---|
| Authentication, password, refresh | PASS WITH RESIDUAL JWT logout window |
| Authorization, IDOR, privilege escalation | PASS trong USER/ADMIN scope đã test |
| Contributor authorization | WHITE-BOX PASS; runtime NOT VERIFIED |
| Input validation, mass assignment | PASS after fixes |
| SQL/ORM injection | PASS in reviewed source |
| XSS | PASS in reviewed render paths |
| CSRF/CORS/open redirect | PASS in tested architecture |
| SSRF/upload/path traversal/webhook | NOT APPLICABLE |
| Quiz/progress business integrity | PASS after deadline fix |
| Rate limiting | PASS single-instance; scale-out needs shared limiter |
| Secrets/Git history | PASS; no real secret found |
| Database least privilege | **ISSUES — BLOCKER** |
| Redis deployment security | SOURCE PASS; network/auth/TLS NOT VERIFIED |
| Docker | STATIC PASS after non-root fix; image build NOT RUNNABLE |
| Dependencies | npm PASS; Maven advisory lookup INCOMPLETE |
| CI/CD | ISSUES/IMPROVEMENTS — password SSH and action pinning should be hardened |
| VPS/TLS/firewall/DNS/backup/monitoring | NOT VERIFIED — production checklist |

## Regression result

- Backend: `mvnw.cmd test` — **29 passed, 0 failed**.
- Frontend: lint — passed.
- Frontend: TypeScript no-emit — passed.
- Frontend: production build — passed, 35 pages generated.
- npm production dependency audit — 0 vulnerabilities.
- `git diff --check` — passed.
- Frontend runtime headers — verified on local production server.
- Security runtime:
  - invalid/modified token → 401;
  - USER → admin endpoint → 403;
  - ADMIN → admin list → 200;
  - cross-user attempt → 404;
  - refresh rotation/logout replay → 401;
  - deactivated account using old access token → 401;
  - rate-limited auth request → 429;
  - hostile BFF Origin → 403.

## Remaining risks và production checklist

1. **Block deployment:** provision and switch to least-privileged DB runtime role; retest grants.
2. Verify Nginx overwrites `X-Forwarded-For`, binds backend/Redis to private or loopback interfaces and only
exposes intended ports.
3. Verify HTTPS everywhere, then enable HSTS at reverse proxy; review CSP without `unsafe-inline` when
nonce/hash migration is practical.
4. Verify Redis authentication/TLS/network ACL if Redis leaves a private Docker network.
5. Replace password-based deployment SSH with key/OIDC where practical; pin third-party Actions to reviewed
commit SHAs; ensure PR jobs cannot access production secrets.
6. Run Maven advisory scanner/SBOM review and Docker image scanner in CI.
7. Add shared gateway/Redis rate limiting before horizontal scaling.
8. Remember logout revokes refresh token; a stolen access token remains usable until its short TTL unless
account state/role changes. Consider JTI/token-version revocation only if threat model requires immediate
per-session access-token invalidation.
9. Perform gray-box CONTRIBUTOR and live production-config smoke tests in staging.

## Files changed by the audit

- Backend security filters/properties and Security filter chain.
- Quiz deadline enforcement and race-condition repository locks.
- Auth DTO redaction and request-size validation.
- Production Spring profile, Docker non-root runtime and least-privilege DB guidance.
- Frontend HTTP security headers.
- Focused security/domain regression tests.

