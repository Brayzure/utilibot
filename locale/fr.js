module.exports.BAN_EXPIRE_REASON = "Le bannissement temporaire a expiré automatiquement.";

/*
* VERBOSE LOGGING
* Messages posted to the verbose (full) log channel
*/
// Message was deleted
module.exports.VERBOSE_MESSAGE_DELETE = (channel, user, message) => `**Salon**: <#${channel.id}> Le message de **${user.username}#${user.discriminator}** a été supprimé. Contenu:\n${message.cleanContent}`;
// A user was banned from the guild
module.exports.VERBOSE_GUILD_BAN = (user, guild) => `**${user.username}#${user.discriminator}** a été banni de la guilde. Nombre de membres: **${guild.memberCount}**`;
// A user message was edited
module.exports.VERBOSE_MESSAGE_EDIT = (channel, user, oldMessage, newMessage) => `**Salon**: <#${channel.id}> Le message de **${user.username}#${user.discriminator}** a été modifié.\nAncien contenu:\n${oldMessage.cleanContent}\nNouveau contenu:\n${newMessage.cleanContent}`;
// A member joined the guild
module.exports.VERBOSE_MEMBER_JOIN = (user, guild) => `**${user.username}#${user.discriminator}** a rejoint la guilde. Nombre de membres: ${guild.memberCount}`;
// A member left the guild
module.exports.VERBOSE_MEMBER_LEAVE = (user, guild) => `**${user.username}#${user.discriminator}** a quitté la guilde. Nombre de membres: ${guild.memberCount}`;

/*
* PM MESSAGES
* Messages sent to users via Direct messaging
*/
// Informing user they were muted
module.exports.YOU_HAVE_BEEN_MUTED = (guild, user) => `${user.username}#${user.discriminator} vous a empêché de parler dans **${guild.name}**.`
// Informing user they were unmuted
module.exports.YOU_HAVE_BEEN_UNMUTED = (guild, user) => `${user.username}#${user.discriminator} vous a rétabli la parole dans **${guild.name}**.`
// Appended to PM messages if a reason is provided
module.exports.REASON = (reason) => `Une raison a été fournie: ${reason}`;
// Appended to PM messages if the user may want to contact a moderator
module.exports.CONTACT_MODERATOR = "Vous pouvez contacter les modérateurs pour une explication plus détaillée.";

/*
* SUCCESS MESSAGES
* Messages sent in response to a successful command execution
* Sent in the channel the command was invoked in
*/
// The given entry was added to a list (blacklist, mod list, etc)
module.exports.ADDED_TO_LIST = (entry, list) => `**${entry}** a été ajouté à la liste «**${list}**»`;
// A muted role has been set for the guild
module.exports.SET_MUTED_ROLE = (role) => `Le role **${role.name}** a été défini comme rôle de Sourdine avec succès!`;
// A user was successfully unmuted via command
module.exports.USER_UNMUTED = "La parole de l'utilisateur a été rétablie avec succès!";
// A user was successfully muted via command
module.exports.USER_MUTED = "La parole de l'utilsiateur a été bloquée avec succès!";

/*
* ERROR MESSAGES
* Messages sent in response to a failed command execution
* Sent in the channel the command was invoked in
*/
// The user did not provide enough arguments when running the command
module.exports.NOT_ENOUGH_ARGUMENTS = (prefix, usage) => `Vous n'avez pas fourni suffisamment d'arguments! Usage: \`${prefix}${usage}\``;
// The user either did not provide a member, or provided and invalid member
module.exports.NO_MEMBER = "L'utilisateur est introuvable! Assurez-vous de l'avoir mentionné ou d'avoir utilisé son identifiant.";
// A command related to mutes was run without a Muted role being set
module.exports.NO_MUTED_ROLE = (prefix) => `Vous devez créer le rôle de Sourdine et le définir avec \`${prefix}set muted <ID du rôle>\`!`;
// The user tried to add or remove a role from a list, but the role doesn't exist
module.exports.NO_ROLE_FOUND = "Ce rôle est introuvable sur le serveur!";
// The user tried to add or remove an item from a list, but the list doesn't exist
module.exports.NO_LIST_FOUND = "La liste spécifiée est introuvable!";
// The user tried to add a role to a list, but the role was already on the list
module.exports.ROLE_ON_LIST = "Ce rôle est déjà dans la liste!";
// The user tried to unmute a user that wasn't muted to begin with
module.exports.USER_NOT_MUTED = "La parole de l'utilisateur n'a pas été bloquée!";
// The user tried to mute a user that is already muted
module.exports.USER_ALREADY_MUTED = "La parole de cet utilisateur est déjà bloquée!";
