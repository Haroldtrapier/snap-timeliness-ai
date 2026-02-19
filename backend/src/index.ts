import app from './app'
import prisma from './config/database'

const PORT = parseInt(process.env.PORT ?? '3001')

async function main() {
  // Test database connection
  await prisma.$connect()
  console.log('Database connected')

  app.listen(PORT, () => {
    console.log(`SNAP-AI API running on port ${PORT} [${process.env.NODE_ENV ?? 'development'}]`)
    console.log(`Health check: http://localhost:${PORT}/health`)
  })
}

main().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})
