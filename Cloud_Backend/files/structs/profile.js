const fs = require('fs')
const Athena = require('../models/Athena')
const CommonCore = require('../models/CommonCore')

module.exports = {
    async commoncore(id) {
        var commoncore = await CommonCore.findOne({ id: id })
        var final = {
            changeType: "fullProfileUpdate",
            profile: {
                _id: id,
                created: commoncore.createdAt,
                updated: new Date(),
                rvn: 1,
                wipeNumber: 1,
                id: id,
                profileId: "common_core",
                version: "cloud2",
                items: {
                    "Currency:MtxPurchased": {
                        attributes: {
                            platform: commoncore.mtxplatform
                        },
                        quantity: commoncore.vbucks,
                        templateId: "Currency:MtxPurchased"
                    }
                },
                stats: {
                    survey_data: {
                        allSurveysMetadata: {},
                        metadata: {}
                    },
                    personal_offers: {},
                    intro_game_played: true,
                    mtx_purchase_history: {
                        refundsUsed: 0,
                        refundCredits: 69,
                        purchases: []
                    },
                    undo_cooldowns: [],
                    import_friends_claimed: {},
                    mtx_affiliate_set_time: new Date(),
                    inventory_limit_bonus: 0,
                    current_mtx_platform: "EpicPC",
                    mtx_affiliate: "",
                    weekly_purchases: {},
                    daily_purchases: {},
                    ban_history: {},
                    in_app_purchases: {
                        receipts: [],
                        ignoredReceipts: [],
                        fulfillmentCounts: {}
                    },
                    undo_timeout: new Date(),
                    permissions: [],
                    monthly_purchases: {
                        lastInterval: new Date(),
                        purchaseList: {}
                    },
                    allowed_to_send_gifts: true,
                    mfa_enabled: true,
                    allowed_to_receive_gifts: true,
                    gift_history: {
                        num_sent: 0,
                        sentTo: {},
                        num_received: 0,
                        receivedFrom: {},
                        gifts: []
                    }
                }
            }
        }
        return final
    },

    async athena(id) {
        var athena = await Athena.findOne({ id: id })
        var final = {
            changeType: "fullProfileUpdate",
            profile: {
                _id: id,
                created: new Date(),
                updated: new Date(),
                rvn: 1,
                wipeNumber: 1,
                id: id,
                profileId: "athena",
                version: "fdev_release_may_2020",
                items: {
                    "CosmeticLocker:cosmeticlocker_athena1": {
                        templateId: "CosmeticLocker:cosmeticlocker_athena",
                        attributes: {
                            locker_slots_data: {
                                slots: {
                                    Glider: {
                                        items: [
                                            athena.glider
                                        ]
                                    },
                                    Dance: {
                                        items: athena.dance,
                                    },
                                    SkyDiveContrail: {
                                        items: [
                                            athena.skydivecontrail,
                                        ]
                                    },
                                    LoadingScreen: {
                                        items: [
                                            athena.loadingscreen,
                                        ]
                                    },
                                    Pickaxe: {
                                        items: [
                                            athena.pickaxe,
                                        ],
                                        activeVariants: [
                                            athena.pickaxevariants.length != 0 ?
                                                {
                                                    variants: athena.pickaxevariants
                                                } : null
                                        ]
                                    },
                                    ItemWrap: {
                                        items: athena.itemwrap,
                                    },
                                    MusicPack: {
                                        items: [
                                            athena.musicpack
                                        ]
                                    },
                                    Character: {
                                        items: [
                                            athena.character
                                        ],
                                        activeVariants: [
                                            athena.charactervariants.length != 0 ?
                                                {
                                                    variants: athena.charactervariants
                                                } : null
                                        ]
                                    },
                                    Backpack: {
                                        items: [
                                            athena.backpack
                                        ],
                                        activeVariants: [
                                            athena.backpackvariants.length != 0 ?
                                                {
                                                    variants: athena.backpackvariants
                                                } : null
                                        ]
                                    }
                                }
                            },
                            use_count: 0,
                            banner_icon_template: athena.banner,
                            banner_color_template: athena.bannercolor,
                            locker_name: "Cloud",
                            item_seen: false,
                            favorite: false
                        },
                        "quantity": 1
                    },
                    "CosmeticLocker:cosmeticlocker_athena2": {
                        templateId: "CosmeticLocker:cosmeticlocker_athena",
                        attributes: {
                            locker_slots_data: {
                                slots: {
                                    Glider: {
                                        items: [
                                            athena.glider
                                        ]
                                    },
                                    Dance: {
                                        items: athena.dance,
                                        activeVariants: [
                                            null,
                                            null,
                                            null,
                                            null,
                                            null,
                                            null
                                        ]
                                    },
                                    SkyDiveContrail: {
                                        items: [
                                            athena.skydivecontrail
                                        ]
                                    },
                                    LoadingScreen: {
                                        items: [
                                            athena.loadinscreen
                                        ]
                                    },
                                    Pickaxe: {
                                        items: [
                                            athena.pickaxe
                                        ]
                                    },
                                    ItemWrap: {
                                        items: athena.itemwrap
                                    },
                                    MusicPack: {
                                        items: [
                                            athena.musicpack
                                        ]
                                    },
                                    Character: {
                                        items: [
                                            athena.character
                                        ],
                                        activeVariants: [
                                            null
                                        ]
                                    },
                                    Backpack: {
                                        items: [
                                            athena.backpack
                                        ],
                                        activeVariants: [
                                            null
                                        ]
                                    }
                                }
                            },
                            use_count: 0,
                            banner_icon_template: athena.banner,
                            banner_color_template: athena.bannercolor,
                            locker_name: "Cloud",
                            item_seen: false,
                            favorite: false
                        },
                        "quantity": 1
                    },
                },
                stats: {
                    attributes: {
                        past_seasons: [],
                        season_match_boost: 0,
                        loadouts: [
                            "CosmeticLocker:cosmeticlocker_athena1",
                            "CosmeticLocker:cosmeticlocker_athena2"
                        ],
                        mfa_reward_claimed: true,
                        rested_xp_overflow: 0,
                        quest_manager: {
                            dailyLoginInterval: new Date(),
                            dailyQuestRerolls: 1
                        },
                        book_level: athena.level,
                        season_num: 10,
                        season_update: 0,
                        book_xp: 99999999,
                        permissions: [],
                        season: {
                            numWins: 999,
                            numHighBracket: 999,
                            numLowBracket: 999
                        },
                        vote_data: {},
                        lifetime_wins: 0,
                        book_purchased: true,
                        purchased_battle_pass_tier_offers: {},
                        rested_xp_exchange: 1.0,
                        level: athena.level,
                        book_level: athena.level,
                        xp_overflow: 0,
                        rested_xp: 0,
                        rested_xp_mult: 1,
                        accountLevel: athena.level,
                        competitive_identity: {},
                        inventory_limit_bonus: 0,
                        last_applied_loadout: "CosmeticLocker:cosmeticlocker_athena1",
                        favorite_character: athena.character,
                        favorite_backpack: athena.backpack,
                        favorite_pickaxe: athena.pickaxe,
                        favorite_glider: athena.glider,
                        favorite_skydivecontrail: athena.skydivecontrail,
                        favorite_loadingscreen: athena.loadingscreen,
                        favorite_dance: athena.dance,
                        favorite_musicpack: athena.musicpack,
                        favorite_itemwraps: athena.itemwrap,
                        daily_rewards: {},
                        xp: 99999999,
                        season_friend_match_boost: 0,
                        active_loadout_index: 0
                    }
                },
            }
        }

        const cosmetics = JSON.parse(fs.readFileSync(`${__dirname}/../../cloud_data/items/cosmetics.json`))
        const variants = JSON.parse(fs.readFileSync(`${__dirname}/../../cloud_data/items/variants.json`))

        cosmetics.forEach(cosmetic => {
            final.profile.items[`${cosmetic.backendType}:${cosmetic.id.toLowerCase()}`] = {
                templateId: `${cosmetic.backendType}:${cosmetic.id.toLowerCase()}`,
                attributes: {
                    max_level_bonus: 0,
                    level: 1,
                    item_seen: 1,
                    xp: 0,
                    variants: variants.find(x => x.id == cosmetic.id) ? variants.find(x => x.id == cosmetic.id).variants.map(x => {
                        return {
                            channel: x.channel,
                            active: x.properties[0],
                            owned: x.properties
                        }
                    }) : [],
                    favorite: false
                },
                quantity: 1
            }
        })

        variants.forEach(variant => {
            var attempt = cosmetics.find(x => x.id == variant.id)
            variant.vtids.forEach(vtid => {
                final.profile.items[`CosmeticVariantToken:${vtid.toLowerCase()}`] = {
                    templateId: `CosmeticVariantToken:${vtid.toLowerCase()}`,
                    attributes: {
                        max_level_bonus: 0,
                        cosmetic_item: `${attempt.backendType}:${attempt.id.toLowerCase()}`,
                        level: 1,
                        auto_equip_variant: false,
                        item_seen: false,
                        xp: 0,
                        variant_name: variant.variant,
                        create_giftbox: false,
                        variant_channel: variant.channel,
                        favorite: false,
                        mark_item_unseen: true
                    },
                    quantity: 1
                }
            })
        })
        return final
    }
}