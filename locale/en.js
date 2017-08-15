module.exports.BAN_EXPIRE_REASON = "Temporary ban automatically expired.";

/*
* VERBOSE LOGGING
* Messages posted to the verbose (full) log channel
*/
// Message was deleted
module.exports.VERBOSE_MESSAGE_DELETE = (channel, user, message) => `**Channel**: <#${channel.id}> **${user.username}#${user.discriminator}'s** message was deleted. Content:\n${message.cleanContent}`;
// A user was banned from the guild
module.exports.VERBOSE_GUILD_BAN = (user, guild) => `**${user.username}#${user.discriminator}** was banned from the guild. Total members: **${guild.memberCount}**`;
// A user message was edited
module.exports.VERBOSE_MESSAGE_EDIT = (channel, user, oldMessage, newMessage) => `**Channel**: <#${channel.id}> **${user.username}#${user.discriminator}'s** message was edited.\nOld content:\n${oldMessage.cleanContent}\nNew content:\n${newMessage.cleanContent}`;
// A member joined the guild
module.exports.VERBOSE_MEMBER_JOIN = (user, guild) => `**${user.username}#${user.discriminator}** joined the guild. Total members: ${guild.memberCount}`;
// A member left the guild
module.exports.VERBOSE_MEMBER_LEAVE = (user, guild) => `**${user.username}#${user.discriminator}** left the guild. Total members: ${guild.memberCount}`;

/*
* PM MESSAGES
* Messages sent to users via Direct messaging
*/
// Informing user they were muted
module.exports.YOU_HAVE_BEEN_MUTED = (guild, user) => `You have been muted in **${guild.name}** by ${user.username}#${user.discriminator}.`
// Informing user they were unmuted
module.exports.YOU_HAVE_BEEN_UNMUTED = (guild, user) => `You have been unmuted in **${guild.name}** by ${user.username}#${user.discriminator}.`
// Appended to PM messages if a reason is provided
module.exports.REASON = (reason) => `A reason was provided: ${reason}`;
// Appended to PM messages if the user may want to contact a moderator
module.exports.CONTACT_MODERATOR = "Consider messaging the moderator for a more detail explanation.";

/*
* SUCCESS MESSAGES
* Messages sent in response to a successful command execution
* Sent in the channel the command was invoked in
*/
// The given entry was added to a list (blacklist, mod list, etc)
module.exports.ADDED_TO_LIST = (entry, list) => `**${entry}** was successfully added to the **${list}** list!`;
// A muted role has been set for the guild
module.exports.SET_MUTED_ROLE = (role) => `Successfully set **${role.name}** as the Muted role!`;
// A user was successfully unmuted via command
module.exports.USER_UNMUTED = "User successfully unmuted!";
// A user was successfully muted via command
module.exports.USER_MUTED = "User successfully muted!";

/*
* ERROR MESSAGES
* Messages sent in response to a failed command execution
* Sent in the channel the command was invoked in
*/
// The user did not provide enough arguments when running the command
module.exports.NOT_ENOUGH_ARGUMENTS = (prefix, usage) => `You didn't supply enough arguments! Usage: \`${prefix}${usage}\``;
// The user either did not provide a member, or provided and invalid member
module.exports.NO_MEMBER = "Could not find that member! Make sure you mentioned them or used their user ID.";
// A command related to mutes was run without a Muted role being set
module.exports.NO_MUTED_ROLE = (prefix) => `You must create a Muted role and set it using \`${prefix}set muted <role ID>\`!`;
// The user tried to add or remove a role from a list, but the role doesn't exist
module.exports.NO_ROLE_FOUND = "Could not find that role in the server!";
// The user tried to add or remove an item from a list, but the list doesn't exist
module.exports.NO_LIST_FOUND = "Could not find the specified list!";
// The user tried to add a role to a list, but the role was already on the list
module.exports.ROLE_ON_LIST = "That role is already on the list!";
// The user tried to unmute a user that wasn't muted to begin with
module.exports.USER_NOT_MUTED = "This user is not muted!";
// The user tried to mute a user that is already muted
module.exports.USER_ALREADY_MUTED = "This user is already muted!";