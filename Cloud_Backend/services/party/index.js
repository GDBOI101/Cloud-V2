const crypto = require("crypto")

module.exports = class Party {
    constructor(config, joinInfo, meta) {
        this.id = crypto.randomBytes(16).toString("hex")
        this.createdAt = new Date()
        this.updatedAt = new Date()
        this.revision = 0

        this.config = {
            type: "DEFAULT",
            joinability: "OPEN",
            discoverability: "ALL",
            sub_type: "default",
            max_size: 16,
            invite_ttl: 14400,
            join_confirmation: true,
            ...config
        }
        
        this.members = [ 
            {
                account_id : joinInfo.connection.id.split("@")[0],
                meta: {
                    "urn:epic:member:dn_s" : joinInfo.meta["urn:epic:member:dn_s"]
                },
                connections: [ 
                    {
                        id: joinInfo.connection.id,
                        connected_at: new Date(),
                        updated_at: new Date(),
                        yield_leadership: false,
                        meta: joinInfo.connection.meta
                    } 
                ],
                revision: 0,
                updated_at: new Date(),
                joined_at: new Date(),
                role: "CAPTAIN"
            } 
        ]    
        this.meta = meta

        parties.push({
            id: this.id,
            privacy: this.config.joinability,
            members: this.members.map(x => {return x.account_id}),
            party: this
        })

        if (xmppClients[joinInfo.connection.id.split("@")[0]]) {
            xmppClients[joinInfo.connection.id.split("@")[0]].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
                account_dn: joinInfo.meta["urn:epic:member:dn_s"],
                account_id: joinInfo.connection.id.split("@")[0],
                connection: {
                    connected_at: new Date(),
                    id: joinInfo.connection.id.split("@"),
                    meta: joinInfo.connection.meta,
                    updated_at: new Date(),
                    joined_at: new Date()
                },
                member_state_update: {
                    "urn:epic:member:dn_s" : joinInfo.meta["urn:epic:member:dn_s"]
                },
                ns: "Fortnite",
                party_id: this.id,
                revision: this.revision,
                sent: new Date(),
                type: "com.epicgames.social.party.notification.v0.MEMBER_JOINED",
                updated_at: new Date()
            }))
        }
    }

    getPartyLeader() {
        try {
            return this.members.find(x => x.role == "CAPTAIN").account_id
        } catch {
        }
    }

    setPartyLeader(id) {
        var member = this.members.find(x => x.account_id == id)
        var captain = this.members.find(x => x.account_id == this.getPartyLeader())
        member.role = "CAPTAIN"
        captain.role = "MEMBER"

        this.members.splice(this.members.findIndex(x => x.account_id == this.getPartyLeader()), 1, captain)
        this.members.splice(this.members.findIndex(x => x.account_id == id), 1, member)

        this.sendMessageToClients({
            account_id: id,
            member_state_update: {},
            ns: "Fortnite",
            party_id: this.id,
            revision: this.revision || 0,
            sent: new Date(),
            type: "com.epicgames.social.party.notification.v0.MEMBER_NEW_CAPTAIN"
        })
    }

    getPartyInfo() {
        return {
            id: this.id,
            created_at: this.createdAt,
            updated_at: this.updatedAt,
            config: this.config,
            members: this.members,
            applicants: [],
            meta: this.meta,
            invites: [],
            revision: this.revision || 0
        }
    }

    updatePartyMeta(updated, deleted) {
        this.meta = {
            ...this.meta,
            ...updated
        }

        deleted.forEach(x => delete this.meta[x])
        this.revision++
        
        this.sendMessageToClients({
            captain_id: this.getPartyLeader(),
            created_at: this.createdAt,
            invite_ttl_seconds: this.config.invite_ttl,
            max_number_of_members: this.config.max_size,
            ns: "Fortnite",
            party_id: this.id,
            party_privacy_type: this.config.joinability,
            party_state_overriden: {},
            party_state_removed: deleted,
            party_state_updated: updated,
            party_sub_type: "default",
            party_type: "DEFAULT",
            revision: this.revision,
            sent: new Date(),
            type: "com.epicgames.social.party.notification.v0.PARTY_UPDATED",
            updated_at: new Date()
        })
    }

    updateUserMeta(id, updated, deleted) {
        var member = this.members.find(x => x.account_id == id)

        if (member) {
            member.meta = {
                ...member.meta,
                ...updated
            }
            deleted.forEach(x => delete member.meta[x])
            member.revision++
            this.members.splice(this.members.findIndex(x => x.account_id == id), 1, member)

            this.sendMessageToClients({
                account_dn: member.meta["urn:epic:member:dn_s"],
                account_id: member.account_id,
                joined_at: member.joined_at,
                member_state_overridden: {},
                member_state_removed: deleted,
                member_state_updated: updated,
                ns: "Fortnite",
                party_id: this.id,
                revision: member.revision,
                sent: new Date(),
                type: "com.epicgames.social.party.notification.v0.MEMBER_STATE_UPDATED",
                updated_at: new Date()
            })
        }   
    }
    

    addMember(connection, meta) {
        this.members.push({
            account_id : connection.id.split("@")[0],
            meta: meta,
            connections: [ 
                {
                    id: connection.id,
                    connected_at: new Date(),
                    updated_at: new Date(),
                    yield_leadership: false,
                    meta: connection.meta
                } 
            ],
            revision: 0,
            updated_at: new Date(),
            joined_at: new Date(),
            role: "MEMBER"
        })
        parties.splice(parties.findIndex(x => x.id == this.id), 1, {
            id: this.id,
            members: this.members.map(x => {return x.account_id}),
            party: this
        })

        this.sendMessageToClients({
            account_dn: connection.meta["urn:epic:member:dn_s"],
            account_id: connection.id.split("@")[0],
            connection: {
                connected_at: new Date(),
                id: connection.id,
                meta: connection.meta,
                updated_at: new Date()
            },
            joined_at: new Date(),
            member_state_updated: meta,
            ns: "Fortnite",
            party_id: this.id,
            revision: this.members.find(x => x.account_id == connection.id.split("@")[0]).revision || 0,
            sent: new Date(),
            type: "com.epicgames.social.party.notification.v0.MEMBER_JOINED",
            updated_at: new Date()
        })
    }

    removeMember(id) {
        var member = this.members.find(x => x.account_id == id)
        
        if (!member) return;

        
        this.sendMessageToClients({
            account_id: id,
            member_state_update: {},
            ns: "Fortnite",
            party_id: this.id,
            revision: this.revision || 0,
            sent: new Date(),
            type: "com.epicgames.social.party.notification.v0.MEMBER_LEFT"
        })

        this.members.splice(this.members.findIndex(x => x.account_id == id), 1)

        if (this.members.length == 0) {
            return this.deleteParty()
        }

        if (member.role == "CAPTAIN") {
            var member1 = this.members[0]
            member1.role == "CAPTAIN"
            this.members.splice(this.members.findIndex(x => x.account_id == member1.account_id), 1, member1)
        }
    
        parties.splice(parties.findIndex(x => x.id == this.id), 1, {
            id: this.id,
            members: this.members.map(x => {return x.account_id}),
            party: this
        })

    }

    sendMessageToClients(data) {
        this.members.forEach(r => {
            try {
                xmppClients[r.account_id].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify(data))
            } catch (e){
            }
        })
    }

    deleteParty() {
        parties.splice(parties.findIndex(x => x.id == this.id), 1)
    }
}