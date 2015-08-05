var SteamCommunity = require('../index.js');
var SteamID = require('steamid');
var xml2js = require('xml2js');

SteamCommunity.prototype.getSteamGroup = function(id, callback) {
	if(typeof id !== 'string' && !(typeof id === 'object' && id.__proto__ === SteamID.prototype)) {
		throw new Error("id parameter should be a group URL string or a SteamID object");
	}
	
	if(typeof id === 'object' && (id.universe != SteamID.Universe.PUBLIC || id.type != SteamID.Type.CLAN)) {
		throw new Error("SteamID must stand for a clan account in the public universe");
	}
	
	var self = this;
	this.request("https://steamcommunity.com/" + (typeof id === 'string' ? "groups/" + id : "gid/" + id.toString()) + "/memberslistxml/?xml=1", function(err, response, body) {
		if(self._checkHttpError(err, response, callback)) {
			return;
		}
		
		if(self._checkCommunityError(body, callback)) {
			return;
		}
		
		xml2js.parseString(body, function(err, result) {
			if(err) {
				callback(err);
				return;
			}
			
			callback(null, new CSteamGroup(self, result.memberList));
		});
	});
};

function CSteamGroup(community, groupData) {
	this._community = community;
	
	this.steamID = new SteamID(groupData.groupID64[0]);
	this.name = groupData.groupDetails[0].groupName[0];
	this.url = groupData.groupDetails[0].groupURL[0];
	this.headline = groupData.groupDetails[0].headline[0];
	this.summary = groupData.groupDetails[0].summary[0];
	this.avatarHash = groupData.groupDetails[0].avatarIcon[0].match(/([0-9a-f]+)\.jpg$/)[1];
	this.members = parseInt(groupData.groupDetails[0].memberCount[0], 10);
	this.membersInChat = parseInt(groupData.groupDetails[0].membersInChat[0], 10);
	this.membersInGame = parseInt(groupData.groupDetails[0].membersInGame[0], 10);
	this.membersOnline = parseInt(groupData.groupDetails[0].membersOnline[0], 10);
}

CSteamGroup.prototype.getAvatarURL = function(size, protocol) {
	size = size || '';
	protocol = protocol || 'http://';
	
	var url = protocol + "steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/" + this.avatarHash.substring(0, 2) + "/" + this.avatarHash;
	if(size == 'full' || size == 'medium') {
		return url + "_" + size + ".jpg";
	} else {
		return url + ".jpg";
	}
};

CSteamGroup.prototype.getMembers = function(callback) {
	this._community.getGroupMembers(this.steamID, callback);
};

CSteamGroup.prototype.join = function(callback) {
	this._community.joinGroup(this.steamID, callback);
};

CSteamGroup.prototype.leave = function(callback) {
	this._community.leaveGroup(this.steamID, callback);
};

CSteamGroup.prototype.postAnnouncement = function(headline, content, callback) {
	this._community.postGroupAnnouncement(this.steamID, headline, content, callback);
};

CSteamGroup.prototype.scheduleEvent = function(name, type, description, time, server, callback) {
	this._community.scheduleGroupEvent(this.steamID, name, type, description, time, server, callback);
};

CSteamGroup.prototype.setPlayerOfTheWeek = function(steamID, callback) {
	this._community.setGroupPlayerOfTheWeek(this.steamID, steamID, callback);
};

CSteamGroup.prototype.kick = function(steamID, callback) {
	this._community.kickGroupMember(this.steamID, steamID, callback);
};
