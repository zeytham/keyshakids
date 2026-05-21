// ============================================================
// VALIDATION UTILITY — Keysha Kids Collection
// ============================================================

// Jina — herufi tu, min 2, max 50
export const validateName = (name) => {
  if (!name || name.trim().length === 0) return 'Jina linahitajika!'
  if (name.trim().length < 2) return 'Jina liwe na herufi angalau 2!'
  if (name.trim().length > 50) return 'Jina liwe na herufi chini ya 50!'
  if (!/^[a-zA-Z\s\u00C0-\u024F'-]+$/.test(name.trim())) return 'Jina liwe na herufi tu!'
  return null
}

// Simu — nambari tu, exactly 10 digits, ianze na 0
export const validatePhone = (phone) => {
  if (!phone || phone.trim().length === 0) return 'Namba ya simu inahitajika!'
  if (!/^\d+$/.test(phone.trim())) return 'Namba ya simu iwe na nambari tu!'
  if (phone.trim().length !== 10) return 'Namba ya simu iwe na nambari 10 hasa!'
  if (!phone.trim().startsWith('0')) return 'Namba ya simu ianze na 0!'
  return null
}

// PIN — nambari tu, 4-6 digits
export const validatePin = (pin) => {
  if (!pin || pin.trim().length === 0) return 'PIN inahitajika!'
  if (!/^\d+$/.test(pin.trim())) return 'PIN iwe na nambari tu!'
  if (pin.trim().length < 4) return 'PIN iwe na nambari angalau 4!'
  if (pin.trim().length > 6) return 'PIN iwe na nambari chini ya 7!'
  return null
}

// Password — min 8, herufi kubwa, ndogo, nambari
export const validatePassword = (password) => {
  if (!password || password.length === 0) return 'Password inahitajika!'
  if (password.length < 8) return 'Password iwe na herufi angalau 8!'
  if (!/[A-Z]/.test(password)) return 'Password iwe na herufi kubwa angalau moja!'
  if (!/[a-z]/.test(password)) return 'Password iwe na herufi ndogo angalau moja!'
  if (!/[0-9]/.test(password)) return 'Password iwe na nambari angalau moja!'
  return null
}

// Bei — nambari tu, > 0
export const validatePrice = (price) => {
  if (!price && price !== 0) return 'Bei inahitajika!'
  if (isNaN(price)) return 'Bei iwe nambari!'
  if (parseFloat(price) <= 0) return 'Bei iwe zaidi ya 0!'
  if (parseFloat(price) > 10000000) return 'Bei ni kubwa mno!'
  return null
}

// Idadi/Quantity — nambari nzima, >= 0
export const validateQuantity = (qty) => {
  if (!qty && qty !== 0) return 'Idadi inahitajika!'
  if (isNaN(qty)) return 'Idadi iwe nambari!'
  if (!Number.isInteger(Number(qty))) return 'Idadi iwe nambari nzima!'
  if (parseInt(qty) < 0) return 'Idadi isipungue 0!'
  return null
}

// Jina la bidhaa — min 2, max 100
export const validateProductName = (name) => {
  if (!name || name.trim().length === 0) return 'Jina la bidhaa linahitajika!'
  if (name.trim().length < 2) return 'Jina liwe na herufi angalau 2!'
  if (name.trim().length > 100) return 'Jina liwe na herufi chini ya 100!'
  return null
}

// Jina la category
export const validateCategoryName = (name) => {
  if (!name || name.trim().length === 0) return 'Jina la category linahitajika!'
  if (name.trim().length < 2) return 'Jina liwe na herufi angalau 2!'
  if (name.trim().length > 50) return 'Jina liwe na herufi chini ya 50!'
  return null
}

// Kikomo cha deni — nambari, >= 0
export const validateCreditLimit = (limit) => {
  if (limit === '' || limit === null || limit === undefined) return null // Optional
  if (isNaN(limit)) return 'Kikomo iwe nambari!'
  if (parseFloat(limit) < 0) return 'Kikomo isipungue 0!'
  return null
}

// Helper — onyesha error kwenye input
export const getInputStyle = (error) => ({
  borderColor: error ? '#C62828' : undefined,
})

// Helper — validate form nzima
export const validateForm = (fields) => {
  const errors = {}
  let hasErrors = false

  Object.entries(fields).forEach(([key, { value, validator }]) => {
    const error = validator(value)
    if (error) {
      errors[key] = error
      hasErrors = true
    }
  })

  return { errors, hasErrors }
}