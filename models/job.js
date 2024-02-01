"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {

  static async create(data) {
    const job = await db.query(
      `INSERT INTO jobs (title,
                         salary,
                         equity,
                         company_handle)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [
        data.title,
        data.salary,
        data.equity,
        data.companyHandle,
      ]);

    return job.rows[0];
  }

  static async findAll({ minSalary, hasEquity, title } = {}) {
    let q = `SELECT j.id,
                    j.title,
                    j.salary,
                    j.equity,
                    j.company_handle AS "companyHandle",
                    c.name           AS "companyName"
             FROM jobs j
                      LEFT JOIN companies AS c ON c.handle = j.company_handle`;
    let where = [];
    let value = [];

    if (minSalary !== undefined) {
      value.push(minSalary);
      where.push(`salary >= $${value.length}`);
    }
    if (hasEquity === true) {
      where.push(`equity > 0`);
    }
    if (title !== undefined) {
      value.push(`%${title}%`);
      where.push(`title ILIKE $${value.length}`);
    }
    if (where.length > 0) {
      q += " WHERE " + where.join(" AND ");
    }

    q += " ORDER BY title";
    const jobs = await db.query(q, value);
    return jobs.rows;
  }

  static async get(id) {
    const jobs = await db.query(
      ` SELECT id,
               title,
               salary,
               equity,
               company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`, [id]
    );

    const job = jobs.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    const companies = await db.query(
      `SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url      AS "logoUrl"
       FROM companies
       WHERE handle = $1`, [job.companyHandle]);

    delete job.companyHandle;
    job.company = companies.rows[0];

    return job;
  }

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idx = "$" + (values.length + 1);

    const q = `
        UPDATE jobs
        SET ${setCols}
        WHERE id = ${idx}
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"
    `;
    const jobs = await db.query(q, [...values, id]);
    const job = jobs.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  static async remove(id) {
    const result = await db.query(
      `DELETE
       FROM jobs
       WHERE id = $1
       RETURNING id
      `, [id]
    );
    const job = result.rows[0];
    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;
