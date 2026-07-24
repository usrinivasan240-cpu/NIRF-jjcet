import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create JJCET departments
  const departments = [
    { name: "Computer Science and Engineering", code: "CSE", description: "CSE Department" },
    { name: "Information Technology", code: "IT", description: "IT Department" },
    { name: "Electronics and Communication Engineering", code: "ECE", description: "ECE Department" },
    { name: "Mechanical Engineering", code: "ME", description: "Mechanical Department" },
    { name: "Civil Engineering", code: "CE", description: "Civil Department" },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
    console.log(`  Department: ${dept.name} (${dept.code})`);
  }

  // Get department IDs
  const cse = await prisma.department.findUnique({ where: { code: "CSE" } });
  const it = await prisma.department.findUnique({ where: { code: "IT" } });
  const ece = await prisma.department.findUnique({ where: { code: "ECE" } });
  const me = await prisma.department.findUnique({ where: { code: "ME" } });
  const ce = await prisma.department.findUnique({ where: { code: "CE" } });

  const allDepts = [cse!, it!, ece!, me!, ce!];

  // Create faculty for each department
  const facultyNames: Record<string, string[]> = {
    CSE: ["Dr. A. Kumar", "Dr. B. Sharma", "Ms. C. Priya", "Mr. D. Raj"],
    IT: ["Dr. E. Singh", "Dr. F. Devi", "Ms. G. Lakshmi", "Mr. H. Ramesh"],
    ECE: ["Dr. I. Patel", "Dr. J. Nair", "Ms. K. Revathi", "Mr. L. Mohan"],
    ME: ["Dr. M. Gupta", "Dr. N. Iyer", "Ms. O. Sangeetha", "Mr. P. Velu"],
    CE: ["Dr. Q. Reddy", "Dr. R. Menon", "Ms. S. Kavitha", "Mr. T. Sundar"],
  };

  for (const dept of allDepts) {
    const names = facultyNames[dept.code] || [];
    for (let i = 0; i < names.length; i++) {
      const existing = await prisma.faculty.findFirst({ where: { departmentId: dept.id, name: names[i] } });
      if (!existing) {
        await prisma.faculty.create({
          data: {
            name: names[i],
            email: `${names[i].toLowerCase().replace(/[^a-z]/g, "")}@jjcet.edu`,
            departmentId: dept.id,
            designation: i < 2 ? "Professor" : "Assistant Professor",
            qualification: i < 2 ? "Ph.D" : "M.Tech",
          },
        });
      }
    }
  }
  console.log("  Faculty created for all departments");

  // Create publications for each department
  const pubTitles = [
    "Deep Learning for Image Classification",
    "IoT-Based Smart Agriculture",
    "Blockchain for Supply Chain",
    "5G Network Optimization",
    "Green Energy Solutions",
    "AI in Healthcare",
    "Cloud Computing Security",
    "Data Analytics for Education",
  ];

  for (const dept of allDepts) {
    for (let i = 0; i < 3; i++) {
      await prisma.publication.create({
        data: {
          title: `${pubTitles[i]} - ${dept.name}`,
          departmentId: dept.id,
          status: "published",
          type: "journal",
          isSCI: i === 0,
          isScopus: i < 2,
          publicationDate: "2025-01-15",
        },
      });
    }
  }
  console.log("  Publications created");

  // Create patents
  for (const dept of allDepts) {
    for (let i = 0; i < 2; i++) {
      await prisma.patent.create({
        data: {
          title: `Patent ${i + 1} - ${dept.name}`,
          departmentId: dept.id,
          isGranted: i === 0,
          status: i === 0 ? "granted" : "filed",
          filedDate: "2024-06-01",
        },
      });
    }
  }
  console.log("  Patents created");

  // Create research projects
  for (const dept of allDepts) {
    for (let i = 0; i < 2; i++) {
      await prisma.research.create({
        data: {
          title: `Research Project ${i + 1} - ${dept.name}`,
          departmentId: dept.id,
          status: i === 0 ? "ongoing" : "completed",
          fundingAgency: "DST",
          amount: "500000",
        },
      });
    }
  }
  console.log("  Research projects created");

  // Create students
  for (const dept of allDepts) {
    for (let i = 0; i < 5; i++) {
      await prisma.student.create({
        data: {
          name: `Student ${i + 1} - ${dept.code}`,
          departmentId: dept.id,
          rollNumber: `${dept.code}2024${String(i + 1).padStart(3, "0")}`,
        },
      });
    }
  }
  console.log("  Students created");

  // Create events
  for (const dept of allDepts) {
    for (let i = 0; i < 2; i++) {
      await prisma.event.create({
        data: {
          title: `Event ${i + 1} - ${dept.name}`,
          departmentId: dept.id,
          type: "workshop",
          date: "2025-03-15",
        },
      });
    }
  }
  console.log("  Events created");

  // Create targets for academic year 2025
  const categories = ["Publications", "Patents", "Research", "Events", "Students", "Faculty", "PhD Scholars"];
  const targetValues = [8, 3, 4, 6, 20, 4, 2];

  for (const dept of allDepts) {
    for (let i = 0; i < categories.length; i++) {
      await prisma.target.create({
        data: {
          category: categories[i],
          yearly: targetValues[i],
          achieved: Math.floor(targetValues[i] * 0.7),
          year: 2025,
          departmentId: dept.id,
        },
      });
    }
  }
  console.log("  Targets created");

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
