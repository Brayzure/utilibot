module.exports.BAN_EXPIRE_REASON = "Temporary ban automatically expired.";

// Verbose logging
module.exports.VERBOSE_MESSAGE_DELETE = (channel, user, message) => `**Channel**: <#${channel.id}> **${user.username}#${user.discriminator}'s** message was deleted. Content:\n${message.cleanContent}`;
module.exports.VERBOSE_GUILD_BAN = (user, guild) => `**${user.username}#${user.discriminator}** was banned from the guild. Total members: **${guild.memberCount}**`;
module.exports.VERBOSE_MESSAGE_EDIT = (channel, user, oldMessage, newMessage) => `**Channel**: <#${channel.id}> **${user.username}#${user.discriminator}'s** message was edited.\nOld content:\n${oldMessage.cleanContent}\nNew content:\n${newMessage.cleanContent}`;
module.exports.VERBOSE_MEMBER_JOIN = (user, guild) => `**${user.username}#${user.discriminator}** joined the guild. Total members: ${guild.memberCount}`;
module.exports.VERBOSE_MEMBER_LEAVE = (user, guild) => `**${user.username}#${user.discriminator}** left the guild. Total members: ${guild.memberCount}`;

// PM messages
module.exports.YOU_HAVE_BEEN_MUTED = (guild, user) => `You have been muted in **${guild.name}** by ${user.username}#${user.discriminator}.`
module.exports.YOU_HAVE_BEEN_UNMUTED = (guild, user) => `You have been unmuted in **${guild.name}** by ${user.username}#${user.discriminator}.`
module.exports.REASON = (reason) => `A reason was provided: ${reason}`;
module.exports.CONTACT_MODERATOR = "Consider messaging the moderator for a more detail explanation.";

// Success messages
module.exports.ADDED_TO_LIST = (entry, list) => `**${entry}** was successfully added to the **${list}** list!`;
module.exports.SET_MUTED_ROLE = (role) => `Successfully set **${role.name}** as the Muted role!`;
module.exports.USER_UNMUTED = "User successfully unmuted!";
module.exports.USER_MUTED = "User successfully muted!";

// Error messages
module.exports.NOT_ENOUGH_ARGUMENTS = (prefix, usage) => `You didn't supply enough arguments! Usage: \`${prefix}${usage}\``;
module.exports.NO_MEMBER = "Could not find that member! Make sure you mentioned them or used their user ID.";
module.exports.NO_MUTED_ROLE = (prefix) => `You must create a Muted role and set it using \`${prefix}set muted <role ID>\`!`;
module.exports.NO_ROLE_FOUND = "Could not find that role in the server!";
module.exports.NO_LIST_FOUND = "Could not find the specified list!";
module.exports.ROLE_ON_LIST = "That role is already on the list!";
module.exports.USER_NOT_MUTED = "This user is not muted!";
module.exports.USER_ALREADY_MUTED = "This user is already muted!";