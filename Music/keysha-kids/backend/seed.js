const { Client } = require('pg')
const bcrypt = require('bcryptjs')

const client = new Client({
  connectionString: 'postgresql://postgres:HZCCengfySUDNjNXGOhYDRzwRShFYaVF@centerbeam.proxy.rlwy.net:38798/railway'
})

async function main() {
  console.log('🌱 Inaungana na database...')
  await client.connect()

  // Futa user wa zamani kwanza
  await client.query(`DELETE FROM users WHERE phone = '0700000000'`)
  console.log('🗑️ User wa zamani amefutwa!')

  // Unda password na pin kwa bcrypt rounds 12
  const passwordHash = await bcrypt.hash('Admin@1234', 12)
  const pinHash = await bcrypt.hash('1234', 12)

  // Verify kwanza
  const check = await bcrypt.compare('Admin@1234', passwordHash)
  console.log('✅ Password verify:', check)

  const result = await client.query(`
    INSERT INTO users (id, name, phone, "passwordHash", "pinHash", role, "isActive", "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      'Keysha Admin',
      '0700000000',
      $1,
      $2,
      'OWNER',
      true,
      NOW(),
      NOW()
    )
    RETURNING id, name, phone, role
  `, [passwordHash, pinHash])

  console.log('✅ Owner ameundwa:', result.rows[0])

  // Verify mwisho
  const saved = await client.query(`SELECT "passwordHash" FROM users WHERE phone = '0700000000'`)
  const finalCheck = await bcrypt.compare('Admin@1234', saved.rows[0].passwordHash)
  console.log('✅ Final verify:', finalCheck)

  await client.end()
}

main().catch(e => {
  console.error('❌ Error:', e.message)
  process.exit(1)
})