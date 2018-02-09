const request = require('request-promise');

function main(args) {
  console.log('rating.nexmo', args);

  // args.text is the message body for this inbound message.
  if (!args.text) {
    console.log('[KO] No text specified');
    return { ok: false };
  }

  return new Promise((resolve) => {
    const replies = [
      'Thank you! 👍',
      'Merci ! 🤟',
      'Thanks for your vote 🙂',
      'Muchas gracias 🤖'
    ];
    request({
      method: 'POST',
      uri: 'https://rest.nexmo.com/sms/json',
      form: {
        api_key: args['services.nexmo.api_key'],
        api_secret: args['services.nexmo.api_secret'],
        to: args.msisdn,
        from: args['services.nexmo.from'],
        text: replies[Math.floor(Math.random() * replies.length)],
        type: 'unicode'
      }
    }).finally(() => {
      try {
        resolve(extractVote(args));
      } catch (err) {
        resolve({ ok: false });
      }
    });
  });
}
exports.main = global.main = main;

function extractVote(args) {
  const message = args.text.trim();

  // https://en.wikipedia.org/wiki/Emoticons_(Unicode_block)
  // https://getemoji.com/
  const ratings = {
    verygood: ['😁', '😂', '😃', '😊', '😍', '😎', '😏', '😛', '😜', '😝', '🤘'],
    good: ['😀', '😄', '😅', '😆', '😉', '🙂'],
    bad: ['😐', '😑', '😒', '😓', '😔', '😕', '😟', '😧', '😪', '🙁', '🙃', '🤨'],
    verybad: ['😖', '😞', '😠', '😡', '😢', '😣', '😤', '😥', '😫', '😭', '😩', '🙄']
  };

  // does the message contain an emoji?
  let messageRating;
  Object.keys(ratings).forEach((rating) => {
    // does the ratingText contain any emoji
    if (!messageRating && ratings[rating].find(emoji => message.indexOf(emoji) >= 0)) {
      messageRating = rating;
    }
  });

  // extract the keyword if possible
  const firstSpace = message.indexOf(' ');
  const keyword = firstSpace >= 0 ? message.slice(0, firstSpace) : message;

  console.log('Rating for >', keyword, '< >', messageRating, '<');

  return {
    shortcode: keyword,
    rating: messageRating
  };
}
