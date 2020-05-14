const crypto = require("crypto")
const ALGORITHM = "aes-256-cbc"

async function encrypt(text, password) {
    const salt = crypto.randomBytes(32).toString("hex")
    const key = crypto.scryptSync(password, salt, 32)
    const iv = Buffer.alloc(16, 0) // Initialization vector
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    return new Promise((resolve, reject) => {
        let encrypted = ""

        cipher.on("readable", () => {
            let chunk
            while (null !== (chunk = cipher.read())) {
                encrypted += chunk.toString("hex")
            }
        })

        cipher.on("end", () => {
            resolve({ encrypted, salt })
        })

        cipher.write(text)
        cipher.end()
    })
}

async function decrypt(text, password, salt) {
    const key = crypto.scryptSync(password, salt, 32)
    const iv = Buffer.alloc(16, 0) // Initialization vector
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)

    return new Promise((resolve, reject) => {
        let decrypted = ""
        let chunk = null

        decipher.on("readable", () => {
            while (null !== (chunk = decipher.read())) {
                decrypted += chunk.toString("utf8")
            }
        })

        decipher.on("end", () => {
            resolve({ decrypted })
        })

        decipher.write(text, "hex")
        decipher.end()
    })
}

module.exports = {
    encrypt,
    decrypt
}
