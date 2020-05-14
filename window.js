const fs = require("fs").promises
const { dialog } = require("electron").remote
const { encrypt, decrypt } = require("./encryption")

const maxBackupLength = 10
const notifTypes = {
    success: {
        backgroundColor: "#b9f6ca",
        borderColor: "#69f0ae"
    },
    error: {
        backgroundColor: "#f6bebb",
        borderColor: "#f0716a"
    }
}

let currentlyOpenFile = null

function showNotification(text, type) {
    const notif = document.getElementById("notif")

    notif.innerText = text
    notif.style.backgroundColor = type.backgroundColor
    notif.style.borderColor = type.borderColor
    notif.style.visibility = "visible"
    notif.style.opacity = 1

    setTimeout(() => notif.click(), 4000)
}

async function readBackup(path) {
    let backup = null
    try {
        backup = JSON.parse(await fs.readFile(path, "utf8"))
    } catch (e) {
        backup = []
    }

    if (backup.length > maxBackupLength) {
        backup = backup.slice(0, maxBackupLength)
    }

    return backup
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("notif").addEventListener("click", () => {
        document.getElementById("notif").style.visibility = "hidden"
        document.getElementById("notif").style.opacity = 0
    })

    document.getElementById("showPass").addEventListener("click", () => {
        const checkBox = document.getElementById("pass")

        if (checkBox.type === "password") {
            checkBox.type = "text"
        } else {
            checkBox.type = "password"
        }
    })

    document.getElementById("save").addEventListener("click", async () => {
        if (currentlyOpenFile === null) {
            return
        }

        const text = document.getElementById("text").value
        const pass = document.getElementById("pass").value

        if (!pass) {
            showNotification("No password provided", notifTypes.error)
            return
        }

        const { encrypted, salt } = await encrypt(text, pass)
        const json = {
            encrypted,
            salt
        }

        const backupFilePath = `${currentlyOpenFile}.bak`
        const backup = await readBackup(backupFilePath)

        backup.unshift(json)

        await fs.writeFile(backupFilePath, JSON.stringify(backup), "utf8")
        await fs.writeFile(currentlyOpenFile, JSON.stringify(json), "utf8")

        showNotification("File saved", notifTypes.success)
    })

    document.getElementById("saveAs").addEventListener("click", async () => {
        const { canceled, filePath } = await dialog.showSaveDialog({
            filters: [{ name: "Encrypted files", extensions: ["enc"] }]
        })

        if (canceled) {
            return
        }

        const text = document.getElementById("text").value
        const pass = document.getElementById("pass").value

        if (!pass) {
            showNotification("No password provided", notifTypes.error)
            return
        }

        const { encrypted, salt } = await encrypt(text, pass)
        const json = {
            encrypted,
            salt
        }

        const backupFilePath = `${filePath}.bak`
        const backup = await readBackup(backupFilePath)

        backup.unshift(json)

        await fs.writeFile(backupFilePath, JSON.stringify(backup), "utf8")
        await fs.writeFile(filePath, JSON.stringify(json), "utf8")

        showNotification("File saved", notifTypes.success)
    })

    document.getElementById("open").addEventListener("click", async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            filters: [{ name: "Encrypted files", extensions: ["enc"] }]
        })

        if (canceled) {
            return
        }

        const filePath = filePaths[0]
        const pass = document.getElementById("pass").value

        if (!pass) {
            showNotification("No password provided", notifTypes.error)
            return
        }

        const { encrypted, salt } = JSON.parse(await fs.readFile(filePath, "utf8"))

        const { decrypted } = await decrypt(encrypted, pass, salt)
        document.getElementById("text").value = decrypted
        currentlyOpenFile = filePath

        showNotification("File opened", notifTypes.success)
    })
})
