import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding data...');

    const hashedPassword = await bcrypt.hash('Test@1234', 12);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@test.com' },
        update: {},
        create: { name: 'Admin User', email: 'admin@test.com', password: hashedPassword },
    });

    const member1 = await prisma.user.upsert({
        where: { email: 'member1@test.com' },
        update: {},
        create: { name: 'Member One', email: 'member1@test.com', password: hashedPassword },
    });

    const member2 = await prisma.user.upsert({
        where: { email: 'member2@test.com' },
        update: {},
        create: { name: 'Member Two', email: 'member2@test.com', password: hashedPassword },
    });

    const project1 = await prisma.project.create({
        data: {
            name: 'Alpha Project',
            description: 'First test project',
            members: {
                create: [
                    { userId: admin.id, role: 'ADMIN' },
                    { userId: member1.id, role: 'MEMBER' }
                ]
            }
        }
    });

    const project2 = await prisma.project.create({
        data: {
            name: 'Beta Launch',
            description: 'Second test project',
            members: {
                create: [
                    { userId: admin.id, role: 'ADMIN' },
                    { userId: member2.id, role: 'MEMBER' }
                ]
            }
        }
    });

    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 10);

    const pastDue = new Date();
    pastDue.setDate(pastDue.getDate() - 2);

    await prisma.task.createMany({
        data: [
            { title: 'Setup Repo', status: 'DONE', priority: 'HIGH', projectId: project1.id, creatorId: admin.id, assigneeId: admin.id },
            { title: 'Design DB', status: 'IN_REVIEW', priority: 'MEDIUM', dueDate: farFuture, projectId: project1.id, creatorId: admin.id, assigneeId: member1.id },
            { title: 'Write Tests', status: 'TODO', priority: 'LOW', dueDate: pastDue, projectId: project1.id, creatorId: admin.id, assigneeId: member1.id }, // Overdue
            { title: 'Beta Marketing', status: 'IN_PROGRESS', priority: 'URGENT', dueDate: farFuture, projectId: project2.id, creatorId: admin.id, assigneeId: member2.id },
        ]
    });

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
