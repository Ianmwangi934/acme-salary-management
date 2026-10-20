# ACME Salary Management

**A full-stack employee and compensation management platform built with Django REST Framework, React, and PostgreSQL.**

[![Django](https://img.shields.io/badge/Django-5.2-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-Frontend-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-See%20Repository-lightgrey)](#license)

## Live Application

**Production:** https://acme.vexlite.dev

**GitHub:** https://github.com/Ianmwangi934/acme-salary-management

> **Project status:** Deployed on Hetzner Cloud with Nginx, Gunicorn, PostgreSQL, and HTTPS secured by Let's Encrypt.

---

## 1. Project Overview

ACME Salary Management is a full-stack web application designed to support employee information management and salary administration through a centralized interface.

The application combines a RESTful backend with a modern React frontend, providing a foundation for employee data management, compensation administration, and access-controlled HR workflows.

The project demonstrates practical full-stack engineering concepts, including:

- REST API design and implementation.
- Relational database modeling.
- Authentication and role-based authorization.
- Employee and compensation data management.
- Database seeding with deterministic synthetic records.
- Frontend and backend integration.
- Cloud infrastructure provisioning.
- Production deployment and reverse proxy configuration.
- HTTPS security and certificate renewal.
- Application testing and operational verification.

The application was developed as a software engineering take-home assessment for **Incubyte**.

---

## 2. Key Features

### Employee Management

The application provides a centralized interface for working with employee records.

Core capabilities include:

- Accessing employee information through the application.
- Retrieving employee data from PostgreSQL through Django REST Framework.
- Supporting employee data operations subject to backend permissions.
- Working with a seeded dataset of 10,000 employees.

### Salary and Compensation Management

The backend maintains compensation records associated with employees.

The compensation module is designed to support HR workflows while restricting unauthorized modifications.

### Authentication and Authorization

The application uses Django's authentication and permission system.

Two primary access levels are implemented:

| User Type | Access |
|---|---|
| Authenticated user | Read access to resources protected by `IsHRStaffOrReadOnly` |
| HR staff | Read and write access to resources protected by `IsHRStaffOrReadOnly` |
| HR staff | Access to operations protected by `IsHRStaff` |
| Unauthenticated user | Access depends on the endpoint's configured permissions |

HR authorization is granted to users who are either Django staff members or members of the `HR` group.

The application includes custom permission classes:

- `IsHRStaffOrReadOnly`
- `IsHRStaff`

These permission classes are defined in:

`backend/employees/permissions.py`

**Security principle:** Authorization is enforced on the backend rather than relying solely on frontend controls.

### Synthetic Employee Dataset

The application includes a Django management command for generating deterministic test data.

The production database was initialized with:

| Dataset | Records |
|---|---:|
| Employees | 10,000 |
| Compensation records | 10,000 |

The seeding command is:

```bash
python manage.py seed_employees
```

The dataset is synthetic and intended for application demonstration and testing.

---

## 3. Technology Stack

### Backend

| Technology | Purpose |
|---|---|
| Python 3.12 | Backend programming language |
| Django 5.2 | Web framework and ORM |
| Django REST Framework | REST API development |
| PostgreSQL 16 | Relational database |
| psycopg 3 | PostgreSQL database adapter |
| python-decouple | Environment-based configuration |
| Gunicorn | Production WSGI application server |

### Frontend

| Technology | Purpose |
|---|---|
| React | User interface |
| JavaScript | Frontend application logic |
| Vite | Development and production build tooling |
| Axios | HTTP requests to backend APIs |
| pnpm | Package management |

### Infrastructure and Deployment

| Technology | Purpose |
|---|---|
| Hetzner Cloud | Virtual private server hosting |
| Ubuntu 24.04 LTS | Server operating system |
| Nginx | Web server and reverse proxy |
| systemd | Backend service management |
| Let's Encrypt | TLS/SSL certificates |
| Certbot | Certificate issuance and renewal |
| Porkbun | Domain management |
| Git / GitHub | Version control and source hosting |

---

## 4. System Architecture

The application follows a separated frontend/backend architecture deployed on a single cloud server.

```text
                  User / Web Browser
                          |
                          |
                  HTTPS (Port 443)
                          |
                          v
                  acme.vexlite.dev
                          |
                          v
                    Nginx Server
                          |
              +-----------+-----------+
              |                       |
              v                       v
        React Frontend           Django Backend
       Static Vite Build          /api/ routes
              |                       |
              |                   Gunicorn
              |                127.0.0.1:8010
              |                       |
              |                       v
              |                Django REST API
              |                       |
              |                       v
              |                  Django ORM
              |                       |
              |                       v
              |                 PostgreSQL 16
              |                  localhost
              |                       |
              +-----------------------+
```

### Request Flow

1. A user visits `https://acme.vexlite.dev`.
2. Nginx handles the HTTPS connection.
3. Requests for the frontend are served from the React production build.
4. React communicates with the backend through same-origin `/api/` requests.
5. Nginx forwards API requests to Gunicorn.
6. Gunicorn passes requests to Django.
7. Django authenticates requests, evaluates permissions, and processes business logic.
8. Django interacts with PostgreSQL through its ORM.
9. API responses are returned to React and rendered in the browser.

### Why This Architecture?

The architecture separates the user interface, API, and persistence layers while keeping deployment relatively straightforward.

Key advantages include:

- Clear separation of responsibilities.
- Independent frontend and backend development.
- Centralized backend authorization.
- Efficient static asset serving.
- Database isolation from the public internet.
- HTTPS termination through Nginx.
- Persistent backend execution through systemd.

---

## 5. Project Structure

The repository is organized around separate frontend and backend applications.

```text
acme-salary-management/
|
+-- backend/
|   |
|   +-- acme_backend/
|   |   +-- settings.py
|   |   +-- urls.py
|   |   +-- wsgi.py
|   |
|   +-- employees/
|   |   +-- permissions.py
|   |   +-- management/
|   |       +-- commands/
|   |           +-- seed_employees.py
|   |
|   +-- manage.py
|   +-- .env                 # Local only; never commit
|   +-- .venv/               # Local virtual environment
|   +-- staticfiles/         # Generated static assets
|
+-- frontend/
|   |
|   +-- src/
|   |   +-- api/
|   |       +-- client.js
|   |
|   +-- dist/                # Generated production build
|   +-- package.json
|
+-- README.md
```

This diagram highlights confirmed files and directories rather than every file in the repository.

The Django project configuration is located in `backend/acme_backend/`, while the React application is maintained independently in `frontend/`.

---

## 6. Database Design

The backend uses PostgreSQL for persistent application data.

### Employee Data

Employee records represent the workforce managed by the application.

### Compensation Data

Compensation records store salary-related information associated with employees.

### Authentication Data

Django's authentication system manages user identities and authorization-related information.

The backend uses Django's ORM to interact with the database, allowing database operations to be expressed through Python models and querysets.

### Database Seeding

The application includes a custom management command:

```bash
python manage.py seed_employees
```

The production seeding process successfully generated:

- 10,000 synthetic employee records.
- 10,000 synthetic compensation records.

The seeded records provide a consistent dataset for demonstrating the application.

**Note:** Exact database fields, constraints, indexes, and relationships should be documented from the Django model definitions.

---

## 7. Getting Started

### Prerequisites

Install the following software before running the project locally:

- Python 3.12 or a compatible version.
- PostgreSQL 16 or a compatible version.
- Node.js 22 or a compatible version.
- pnpm 10.
- Git.

### Clone the Repository

```bash
git clone https://github.com/Ianmwangi934/acme-salary-management.git

cd acme-salary-management
```

---

## 8. Backend Setup

### Step 1: Navigate to the Backend

```bash
cd backend
```

### Step 2: Create a Virtual Environment

```bash
python3 -m venv .venv
```

Activate it on Linux or macOS:

```bash
source .venv/bin/activate
```

On Windows:

```powershell
.venv\Scripts\Activate.ps1
```

### Step 3: Install Dependencies

If the repository includes `requirements.txt`, run:

```bash
pip install -r requirements.txt
```

The backend requires Django, Django REST Framework, PostgreSQL support, and the other packages specified by the project.

### Step 4: Configure PostgreSQL

Create a PostgreSQL role and database.

Example:

```sql
CREATE USER acme_salary_user WITH PASSWORD 'replace_with_a_secure_password';

CREATE DATABASE acme_salary_db OWNER acme_salary_user;
```

Use a strong, unique password in your own environment.

### Step 5: Configure Environment Variables

Create a `.env` file inside the `backend/` directory.

The production deployment uses environment-based configuration for Django and PostgreSQL.

Example:

```dotenv
DJANGO_SECRET_KEY=replace_with_a_unique_secret_key
DJANGO_DEBUG=True

DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
DJANGO_CSRF_TRUSTED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000

DB_NAME=acme_salary_db
DB_USER=acme_salary_user
DB_PASSWORD=replace_with_your_database_password
DB_HOST=127.0.0.1
DB_PORT=5432
```

**Important:** Verify that these database variable names match the names read by `backend/acme_backend/settings.py`.

Never commit `.env` files, database passwords, Django secret keys, or production credentials to GitHub.

### Step 6: Apply Database Migrations

```bash
python manage.py migrate
```

This creates the database tables defined by the Django models and installed applications.

### Step 7: Seed the Database

```bash
python manage.py seed_employees
```

The command populates the database with synthetic employee and compensation records.

### Step 8: Create an Administrative User

For local development, create a Django superuser:

```bash
python manage.py createsuperuser
```

Follow the prompts to configure the username and password.

For ordinary HR access, use an appropriately permissioned account rather than a superuser.

### Step 9: Start the Backend

```bash
python manage.py runserver
```

The Django development server is normally available at:

`http://127.0.0.1:8000`

The development server is intended for local development, not production hosting.

---

## 9. Frontend Setup

Open another terminal and navigate to the frontend:

```bash
cd frontend
```

### Install Dependencies

```bash
pnpm install
```

### Start the Development Server

```bash
pnpm dev
```

Vite displays the local development URL in the terminal.

### API Configuration

The frontend uses Axios for communication with the backend.

The production API client is configured with a relative base URL:

```javascript
baseURL: "/api/"
```

This allows the frontend and backend to communicate through the same domain in production.

For local development, ensure that Vite's development proxy or equivalent API routing is configured to forward `/api/` requests to Django.

### Create a Production Build

```bash
pnpm build
```

The generated production files are placed in:

```text
frontend/dist/
```

Nginx serves these files in production.

---

## 10. Authentication and Authorization

Authentication establishes the identity of a user, while authorization determines which operations the user is permitted to perform.

### HR Permissions

The application includes two custom permission classes.

**`IsHRStaffOrReadOnly`**

Allows authenticated users to perform safe, read-only requests while restricting write operations to authorized HR personnel.

**`IsHRStaff`**

Restricts access to staff users or users belonging to the `HR` group.

### HR Reviewer Account

The production deployment includes a dedicated reviewer account configured with:

```text
is_staff = True
is_superuser = False
is_active = True
```

This allows HR-related functionality to be evaluated without providing unrestricted Django superuser privileges.

**Reviewer credentials are intentionally excluded from the repository.**

Credentials should be shared privately with authorized reviewers.

---

## 11. API Design

The backend exposes REST API endpoints through Django REST Framework.

In production, the API is routed through:

```text
https://acme.vexlite.dev/api/
```

Nginx forwards requests under `/api/` to the Django application.

The API supports the employee and compensation workflows implemented by the backend.

### API Authentication

Authentication requirements depend on the permissions assigned to individual endpoints.

### API Responses

API endpoints return HTTP responses that the React application processes and displays.

### API Reference

The authoritative list of API endpoints, HTTP methods, request bodies, response formats, filtering parameters, and error codes is defined by the Django URL configuration and API views.

**Before final submission:** Add an endpoint reference table based on `backend/acme_backend/urls.py` and the application URL configurations. Do not treat example URLs as implemented endpoints without verifying them.

---

## 12. Production Deployment

The application is deployed on a Hetzner Cloud virtual private server running Ubuntu 24.04 LTS.

### Deployment Infrastructure

| Component | Configuration |
|---|---|
| Cloud provider | Hetzner Cloud |
| Server plan | CAX11 |
| Architecture | ARM64 |
| Operating system | Ubuntu 24.04 LTS |
| Public IPv4 | `65.21.179.96` |
| Application domain | `acme.vexlite.dev` |
| Web server | Nginx |
| Application server | Gunicorn |
| Database | PostgreSQL 16 |
| HTTPS | Let's Encrypt |
| Certificate management | Certbot |
| Process management | systemd |

### Deployment Directory

The production application is located at:

```text
/srv/acme-salary-management/
```

Backend:

```text
/srv/acme-salary-management/backend/
```

Frontend:

```text
/srv/acme-salary-management/frontend/
```

### Backend Application Server

Gunicorn runs the Django WSGI application:

```bash
gunicorn acme_backend.wsgi:application \
  --bind 127.0.0.1:8010 \
  --workers 2 \
  --timeout 120
```

Binding Gunicorn to `127.0.0.1` prevents direct public access to the application server.

Nginx acts as the public-facing reverse proxy.

### systemd Service

The backend is managed through a dedicated systemd service:

```text
acme-salary.service
```

Useful commands:

```bash
sudo systemctl status acme-salary
```

```bash
sudo systemctl restart acme-salary
```

```bash
sudo journalctl -u acme-salary -f
```

The service is configured to start automatically during server boot.

### Nginx

Nginx performs several responsibilities:

- Serves the compiled React frontend.
- Proxies `/api/` requests to Django.
- Proxies `/admin/` requests to Django.
- Serves Django static assets.
- Terminates HTTPS connections.
- Redirects HTTP traffic to HTTPS.

The site configuration is maintained at:

```text
/etc/nginx/sites-available/acme-salary
```

The enabled configuration is linked through:

```text
/etc/nginx/sites-enabled/acme-salary
```

Validate changes with:

```bash
sudo nginx -t
```

Reload Nginx:

```bash
sudo systemctl reload nginx
```

### Static Files

Django static assets are collected using:

```bash
python manage.py collectstatic --noinput
```

The production static directory is:

```text
backend/staticfiles/
```

React's production assets are generated separately through Vite.

---

## 13. Domain and HTTPS Configuration

The application is accessible through:

**https://acme.vexlite.dev**

The domain is managed through Porkbun.

The `acme` subdomain uses a DNS A record pointing to the Hetzner server.

| DNS Setting | Value |
|---|---|
| Record type | A |
| Host | `acme` |
| IPv4 | `65.21.179.96` |

### TLS Certificate

HTTPS is provided through a Let's Encrypt certificate managed by Certbot.

The certificate was issued successfully and installed in Nginx.

The initial certificate expiration date is:

**18 January 2027**

Certbot has configured automatic certificate renewal.

### Renewal Verification

The renewal process was tested using:

```bash
sudo certbot renew --dry-run
```

The simulation completed successfully.

### HTTPS Security

The production configuration should include the following Django security controls:

```python
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SECURE_SSL_REDIRECT = True

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
```

Nginx must correctly forward the original request protocol to Django.

---

## 14. Testing and Quality Assurance

The project should be validated at both backend and frontend levels.

### Django System Checks

Run:

```bash
python manage.py check
```

For production security checks:

```bash
python manage.py check --deploy
```

### Backend Tests

Run the Django test suite:

```bash
python manage.py test
```

### Frontend Validation

Create a production build:

```bash
pnpm build
```

A successful build confirms that Vite can compile the frontend assets.

### Manual Verification

Important production scenarios include:

- Loading the frontend over HTTPS.
- Authenticating with an authorized account.
- Rejecting invalid credentials.
- Retrieving employee records.
- Accessing compensation information.
- Enforcing HR-only write permissions.
- Verifying application navigation.
- Checking API responses and error handling.
- Confirming database connectivity.
- Confirming HTTP-to-HTTPS redirection.
- Checking application logs for unexpected errors.

**Note:** Automated test coverage percentages and test pass counts should only be reported after running the actual test suites.

---

## 15. Security Considerations

Security is incorporated into the application and deployment architecture.

### Environment-Based Secrets

Sensitive settings are stored in environment variables rather than being hardcoded in source files.

Examples include:

- Django secret key.
- Database credentials.
- Production configuration.

### Backend Authorization

Sensitive operations are protected through Django REST Framework permission classes.

### HTTPS Encryption

Let's Encrypt certificates protect browser-to-server communication through HTTPS.

### Database Isolation

PostgreSQL is accessed locally by the backend rather than being exposed as a public database service.

### Application Server Isolation

Gunicorn listens on the loopback interface and is accessed through Nginx.

### Principle of Least Privilege

A dedicated HR reviewer account is configured without superuser privileges.

### Production Configuration

Production deployments use `DEBUG=False`.

### Secrets Management

The repository must not contain:

- Production `.env` files.
- Database passwords.
- Django secret keys.
- Private TLS keys.
- Reviewer passwords.

---

## 16. Troubleshooting

### Frontend Loads but Login Fails

Check:

1. Whether the user exists in the production database.
2. Whether the account is active.
3. Whether the password is valid.
4. Whether the frontend calls the correct API endpoint.
5. Whether Django returns an authentication or CSRF error.

Inspect backend logs:

```bash
sudo journalctl -u acme-salary -n 100 --no-pager
```

### HTTP 502 Bad Gateway

Check the Gunicorn service:

```bash
sudo systemctl status acme-salary
```

Inspect logs:

```bash
sudo journalctl -u acme-salary -f
```

### Nginx Configuration Errors

Run:

```bash
sudo nginx -t
```

### Database Connection Problems

Verify:

- PostgreSQL is running.
- The database exists.
- The database role has appropriate permissions.
- Environment variables match the database configuration.

### Static Files Not Loading

Run:

```bash
python manage.py collectstatic --noinput
```

Verify that Nginx can read the generated files.

### HTTPS Problems

Check certificate status:

```bash
sudo certbot certificates
```

Test renewal:

```bash
sudo certbot renew --dry-run
```

### Domain Not Resolving

Check DNS:

```bash
dig +short acme.vexlite.dev A
```

Expected result:

```text
65.21.179.96
```

---

## 17. Development Workflow

A typical development workflow is:

1. Create a feature branch.
2. Implement changes in the backend or frontend.
3. Apply migrations when database models change.
4. Run relevant tests.
5. Build the frontend.
6. Review changes for secrets and unintended files.
7. Commit and push the changes.
8. Deploy the updated application.

### Updating the Production Backend

After reviewing and pulling approved changes:

```bash
cd /srv/acme-salary-management

git pull
```

Install backend dependencies if they changed:

```bash
cd backend

source .venv/bin/activate

pip install -r requirements.txt
```

Apply migrations:

```bash
python manage.py migrate
```

Collect static files:

```bash
python manage.py collectstatic --noinput
```

Restart Gunicorn:

```bash
sudo systemctl restart acme-salary
```

### Updating the Production Frontend

```bash
cd /srv/acme-salary-management/frontend

pnpm install

pnpm build
```

Nginx serves the generated `dist/` directory, so rebuilding updates the frontend assets.

**Deployment caution:** Review uncommitted production configuration changes and take appropriate backups before pulling or applying migrations.

---

## 18. Engineering Decisions

### Django REST Framework

Django REST Framework provides a structured way to implement APIs while integrating with Django's ORM, authentication system, and permission model.

### React

React enables the application to maintain a component-based frontend independently of the backend implementation.

### PostgreSQL

PostgreSQL provides relational persistence for employee, compensation, and authentication data.

### Same-Origin API Routing

Using `/api/` behind Nginx simplifies production routing and avoids unnecessary cross-origin communication between the frontend and backend.

### Gunicorn and Nginx

Gunicorn executes the Django application, while Nginx handles incoming web traffic, static assets, and HTTPS termination.

### Deterministic Data Seeding

Synthetic records make it possible to demonstrate and test the application without relying on real employee information.

### systemd

systemd provides service supervision, restart behavior, and automatic startup after a server reboot.

---

## 19. Future Improvements

Potential improvements include:

- Expanded automated test coverage.
- Continuous integration through GitHub Actions.
- Automated deployment pipelines.
- More comprehensive API documentation.
- Additional audit logging for sensitive compensation changes.
- Monitoring and alerting.
- Database backup automation and recovery testing.
- Further frontend performance optimization.
- Improved accessibility and responsive behavior.

These are proposed improvements, not claims about features already implemented.

---

## 20. Project Links

**Live Application:** https://acme.vexlite.dev

**Source Code:** https://github.com/Ianmwangi934/acme-salary-management

---

## 21. Author

**Ian Mwangi Murigu**

Full-Stack Software Engineer

Specializing in Python, Django REST Framework, React, PostgreSQL, and cloud deployment.

**GitHub:** https://github.com/Ianmwangi934

---

## 22. License

No license is specified in this documentation.

Refer to the repository for any applicable license file or usage restrictions.

---

## 23. Acknowledgments

Developed as part of the **Incubyte Software Engineering Take-Home Assessment**.

The project demonstrates the implementation and production deployment of a full-stack salary management application using modern web development technologies.

---

**ACME Salary Management — Built with Django, React, PostgreSQL, and deployed on Hetzner Cloud.**

