const Discord = require("discord.js")
const dotenv = require("dotenv")
const { REST } = require("@discordjs/rest")
const { Routes } = require("discord-api-types/v9")
const fs = require("fs")
const { Player } = require("discord-player")
const path = require("path")
const { Client, GatewayIntentBits } = require('discord.js')

dotenv.config()
const TOKEN = process.env.TOKEN

const LOAD_SLASH = process.argv[2] == "load"

const CLIENT_ID = "1030862065855889420"
const GUILD_ID = "735532418169176204"

const client = new Client({
    intents: [
        "GUILDS",
        "GUILD_VOICE_STATES"
    ]
})

client.slashcommand = new Discord.Collection()
client.player = new Player(client, {
    ytdlOptions:{
        quality:"highestaudio",
        highWaterMark: 1 << 25
    }
})

let command = []

const slashFiles = fs.readdirSync("./slash").filter(file =>file.endsWith(".js"))
for (const file of slashFiles) {
    const slashcmd = require(`./slash/${file}`)
    client.slashcommand.set(slashcmd.data.name, slashcmd)
    if (LOAD_SLASH) command.push(slashcmd.data.toJSON())
}

if (LOAD_SLASH) {
    const rest = new REST({version:"9"}).setToken(TOKEN)
    console.log("Deploying alash command")
    rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {body:command})
    .then(() =>{
        console.log("Successfully loaded")
        process.exit(0)
    })
    .catch((eer)=>{
        if (eer){
            console.log(eer)
            process.exit(1)
        }
    })
}
else {
    client.on("ready",() => {
        console.log(`Logged in as ${client.user.tag}`)
    })
    client.on("interactionCreate", (interaction) => {
        async function handleCommand() {
            if (!interaction.isCommand()) return
            
            const slashcmd = client.slashcommand.get(interaction.commandName)
            
            if (!slashcmd) interaction.reply("not a valid slash command")

            await interaction.deferReply()
            await slashcmd.run({ client, interaction })
        }
        handleCommand()
    })
    client.login(TOKEN)
}