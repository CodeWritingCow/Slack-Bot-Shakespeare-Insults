/*
if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}*/

var Botkit = require('botkit');
var os = require('os');
var shakespeare = require('shakespeare-insult'); // load Shakespeare insult NPM library

var controller = Botkit.slackbot({
    debug: true,
});

var bot = controller.spawn({
    token: process.env.BOT_API_KEY || require('./token'),
    send_via_rtm: true // this enables bot.replyWithTyping()
}).startRTM();


controller.hears(['hello', 'hi'], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.replyWithTyping(message, 'Thou art a ' + shakespeare.random() + '!');

});


controller.hears(['call me (.*)', 'my name is (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, user.name + ', thou art a ' + shakespeare.random() + '!');
        });
    });
});

controller.hears(['what is my name', 'who am i', 'what is mine name'], 'direct_message,direct_mention,mention', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Thy name is ' + user.name + ', and thou art a ' + shakespeare.random() + '!');
        } else {
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                    convo.say('I doth not knoweth thy name, thou ' + shakespeare.random() + '!');
                    convo.ask('What shall I call thee?', function(response, convo) {
                        convo.ask('Thou wanteth me to calleth thee `' + response.text + '`?', [
                            {
                                pattern: 'yes', // aye
                                callback: function(response, convo) {
                                    // since no further messages are queued after this,
                                    // the conversation will end naturally with status == 'completed'
                                    convo.next();
                                }
                            },
                            {
                                pattern: 'no', // nay
                                callback: function(response, convo) {
                                    // stop the conversation. this will cause it to end with status == 'stopped'
                                    convo.stop();
                                }
                            },
                            {
                                default: true,
                                callback: function(response, convo) {
                                    convo.repeat();
                                    convo.next();
                                }
                            }
                        ]);

                        convo.next();

                    }, {'key': 'nickname'}); // store the results in a field called nickname

                    convo.on('end', function(convo) {
                        if (convo.status == 'completed') {
                            bot.reply(message, 'Very well! I shall inscribe thy name upon mine portfolio...');

                            controller.storage.users.get(message.user, function(err, user) {
                                if (!user) {
                                    user = {
                                        id: message.user,
                                    };
                                }
                                user.name = convo.extractResponse('nickname');
                                controller.storage.users.save(user, function(err, id) {
                                    bot.reply(message, 'I shalt calleth thee ' + user.name + ' from now on, thou ' + shakespeare.random() + '!');
                                });
                            });

                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.reply(message, 'Thou art a ' + shakespeare.random() + '!');
                        }
                    });
                }
            });
        }
    });
});

controller.hears(['shutdown', 'goodbye', 'bye', 'get lost'], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.startConversation(message, function(err, convo) {

        convo.ask('Art thou sure thou wanteth me to shutdown?', [
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Farewell, thou ' + shakespeare.random() + '!');
                    convo.next();
                    setTimeout(function() {
                        process.exit();
                    }, 3000);
                }
            },
        {
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('*Phew!*');
                convo.next();
            }
        }
        ]);
    });
});

controller.hears(['uptime', 'identify yourself', 'identify thyself', 'who are you', 'who art thou', 'what is your name', 'what is thy name'],
    'direct_message,direct_mention,mention', function(bot, message) {

        var hostname = os.hostname();
        var uptime = formatUptime(process.uptime());

        bot.reply(message,
            ':robot_face: I am a bot named <@' + bot.identity.name +
             '>. I have been running for ' + uptime + ' on ' + hostname + '.');
    });

controller.hears(['bite me', 'damn you', 'you suck'], 
    'direct_message,direct_mention,mention', function(bot, message) {
        bot.reply(message, 'I bite my thumb at thee! :middle_finger:');
    });

// TODO Say anything else to Shakespeare bot, and he will insult you with random insult!
// TODO Make bot replyWithTyping to all user inputs. Make bot more life-like or "bot-like."