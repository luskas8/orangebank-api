#!/bin/sh

npm run prisma:migrate

npm run prisma:generate

npm run start:dev
