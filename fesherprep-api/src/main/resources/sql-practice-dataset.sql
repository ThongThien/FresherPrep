CREATE TABLE departments (
    id INTEGER PRIMARY KEY,
    name VARCHAR(80) NOT NULL
);

CREATE TABLE employees (
    id INTEGER PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    department_id INTEGER REFERENCES departments(id),
    salary DECIMAL(12,2) NOT NULL,
    active BOOLEAN NOT NULL
);

CREATE TABLE customers (
    id INTEGER PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    city VARCHAR(80) NOT NULL
);

CREATE TABLE customer_orders (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(24) NOT NULL,
    ordered_at DATE NOT NULL
);

INSERT INTO departments VALUES
    (1, 'Engineering'),
    (2, 'Quality Assurance'),
    (3, 'Human Resources');

INSERT INTO employees VALUES
    (1, 'An Nguyen', 1, 1800.00, TRUE),
    (2, 'Binh Tran', 1, 1500.00, TRUE),
    (3, 'Chi Le', 2, 1300.00, TRUE),
    (4, 'Dung Pham', 2, 1100.00, FALSE),
    (5, 'Giang Vo', 3, 1200.00, TRUE);

INSERT INTO customers VALUES
    (1, 'Acme', 'Ha Noi'),
    (2, 'Nova', 'Da Nang'),
    (3, 'Sunrise', 'Ho Chi Minh City'),
    (4, 'Lotus', 'Ha Noi');

INSERT INTO customer_orders VALUES
    (1, 1, 250.00, 'PAID', DATE '2026-01-03'),
    (2, 1, 125.00, 'PAID', DATE '2026-01-08'),
    (3, 2, 480.00, 'PENDING', DATE '2026-01-10'),
    (4, 3, 320.00, 'PAID', DATE '2026-01-12'),
    (5, 3, 80.00, 'CANCELLED', DATE '2026-01-15');

