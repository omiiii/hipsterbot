// DEBUG
var debug = false;		// if we don't want it to post to Twitter! Useful for debugging!
 
// Wordnik stuff
var WordnikAPIKey = '05a1d04c12a9337ca964e0c17420142847dd848fd97c14e79';
var request = require('request');
var inflection = require('inflection');
var pluralize = inflection.pluralize;
var capitalize = inflection.capitalize;
var singularize = inflection.singularize;
var pre;
var objects;
var bands;
var replies = [
			"It's not hipster if you broadcast it. Sorry, not sorry."
		];
 
// Blacklist
var wordfilter = require('wordfilter');
 
// Twitter stuff
var Twit = require('twit');
var T = new Twit(require('./config.js'));			// POINT TO YOUR TWITTER KEYS
var hipsterSearch = {q: "hipster I'm -@Hipster -RT -@", count: 1};
 
// Helper functions for arrays, picks a random thing
Array.prototype.pick = function() {
	return this[Math.floor(Math.random()*this.length)];
}
Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};
 
// Wordnik stuff
function nounUrl(limit) {
	return "http://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=false&includePartOfSpeech=noun&minCorpusCount=5000&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=5&maxLength=-1&limit=" + limit + "&api_key=" + WordnikAPIKey;
}
 
function adjUrl(limit) {
	return "http://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=false&includePartOfSpeech=adjective&minCorpusCount=5000&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=5&maxLength=-1&limit=" + limit + "&api_key=" + WordnikAPIKey;
}
 
function tweet() {
	var tweetText = pre.pick();
	
	if (debug) 
		console.log(tweetText);
	else
		T.post('statuses/update', {status: tweetText }, function(err, reply) {
			if (err !== null) {
				console.log('Error: ', err);
			}
			else {
				console.log('Tweeted: ', tweetText);
			}
		});
}
 
function followAMentioner() {
	T.get('statuses/mentions_timeline', { count:50, include_rts:1 },  function (err, reply) {
		  if (err !== null) {
			console.log('Error: ', err);
		  }
		  else {
		  	var sn = reply.pick().user.screen_name;
			if (debug) 
				consolse.log(sn);
			else {
				//Now follow that user
				T.post('friendships/create', {screen_name: sn }, function (err, reply) {
					if (err !== null) {
						console.log('Error: ', err);
					}
					else {
						console.log('Followed: ' + sn);
					}
				});
			}
		}
	});
}
 
//If someone uses certain queries in their tweets, then my bot will reply to them.
//Mostly if someone uses any mention of hipster, my bot will call them out on it.
function respondToHipster() {
	T.get('search/tweets', hipsterSearch, function (error, data) {
	
	console.log(error, data.statuses[0]);
	  if (!error) {
		var retweet = data.statuses[0];
		var retweetId = "@" + retweet.user.screen_name;
		var tweet = retweetId + " " + replies.pick();
		console.log(tweet);
		
		T.post('statuses/update', {status: tweet, in_reply_to_status_id: data.statuses[0].id_str}, function(err, reply) {
			if (err !== null) {
				console.log('Error: ', err);
			}
			else {
				console.log('Tweeted: ', tweet);
			}
		});
	  }
	  else {
	  	console.log('There was an error with your hashtag search:', error);
	  }
	});
}
 
function runBot() {
	console.log(" ");
	var d=new Date();
	var ds = d.toLocaleDateString() + " " + d.toLocaleTimeString();
	console.log(ds);
 
	// Get 200 nouns and adjectives. 
	request(nounUrl(200), function(err, response, data) {
		if (err != null) return;		// bail if no data
		nouns = eval(data);
		request(adjUrl(200), function(err, response, data2) {
			if (err != null) return;		// bail if no data
			adjs = eval(data2);
 
		// Filter out the bad nouns via the wordfilter
		for (var i = 0; i < nouns.length; i++) {
			if (wordfilter.blacklisted(nouns[i].word))
			{
				console.log("Blacklisted: " + nouns[i].word);
				nouns.remove(nouns[i]);
				i--;
			}				
		}
		
		//"Hipster" Objects
		objects = ["wayfarers", "keytar", "meggings", "messenger bag", "vinyl collection", "chia pet", "Cosby sweater", "tote bag", "flannel shirt", "fanny pack", "hoodie", "keytar", "boxer briefs", "cappucino", "coffee", "frappucino", "macchiato", "chai latte", "soy latte", "skinny latte", "frappé", "mixtape collection", "8-track collection", "v-neck collection", "longboard", "jean shorts", "dreamcatcher"];
 
		//"Hipster" Foods"
		foods = ["kale", "flaxseed", "goat milk", "coconut milk", "zucchini bread", "rosewater", "rosemary", "tofu bacon", "purple asparagus", "marionberries", "seitan", "quinoa", "maple mustard", "blood oranges", "kosher salt", "ginger", "kale chips"];
 
		//Bands that sold out
		bands = ["Arcade Fire", "The White Stripes", "Radiohead", "Green Day", "U2", "fun.", "MGMT", "Bon Iver", "Two Door Cinema Club", "Phoenix", "Franz Ferdinand", "Feist", "Tegan and Sara", "Bastille", "Death Cab for Cutie", "Fleet Foxes", "The Hush Sound", "Vampire Weekend", "Yeah Yeah Yeahs", "Mumford & Sons"];
		
		//Hipster Sayings
		pre = [
			"Have you heard of the " + capitalize(adjs.pick().word) + " " + capitalize(nouns.pick().word) + "? Of course you haven't. It's not mainstream enough. #music",
			"My " + objects.pick() + " is organic and vegan. Yours isn't? Typical.", 
			"My farmers market is out of " + foods.pick() + ". WTF? Guess I need to find another store. #wasteoftime",
			"Does anyone know if I can compost my " + objects.pick() + "? #savingtheenvironment",
			"Does anyone know if I can compost my selfies? #savingtheenvironment",
			"Is this " + objects.pick() + " fair trade? No? Then leave me alone. #wasteoftime",
			"I ran out of film for my Mamiya 645 while taking comtemplative, monochrome photos of " + pluralize(objects.pick()) + ". #artistic #photography",
			"Picking up the new " + capitalize(adjs.pick().word) + " " + capitalize(nouns.pick().word) + " vinyl! #music",
			"Going to the " + capitalize(adjs.pick().word) + " " + capitalize(nouns.pick().word) + " concert. Will I see you there? Probably won't. You've never even heard of them. #music #burn",
			"Have you heard of this microbrew? It's from Europe. I think it's alambic. #spirits #alcohol",
			"I was on my way to a " + capitalize(adjs.pick().word) + " " + capitalize(nouns.pick().word) + " concert. But I forgot my European spirits. Can't forget those.",
			"I used to like " + bands.pick() + ", but now they've sold out to the mainstream audience. Typical.",
			"Were you listening to them when they were indie? If not, then you're not a true fan. #indie #typical",
			"I try to vote libertarian whenever I can. The other parties' ideals are too mainstream for me. #politics",
			"Are you going to Sundance or SXSW?",
			"I have this tattoo of " + pluralize(objects.pick()) + ", because it's post-ironic. You wouldn't understand. #expression",
			"I was going to go to my farmers market to get some " + foods.pick() + ", but I guess Whole Foods will have to do. Ugh. #badday",
			"I only eat the most organic " + foods.pick() + ". Anything else is trash. #healthy #organic",
			"I got a tattoo of " + pluralize(objects.pick()) + ", since it's post-ironic. #freeexpression"
		];
		
		///----- NOW DO THE BOT STUFF
		var rand = Math.random();
 
 		if(rand >= 0.00 && rand < 0.95) {      
			tweet();
			
		} else if (rand >= 0.95) {
			console.log("-------Tweet something @someone");
			respondToHipster();
			
		} else {
			console.log("-------Follow someone who @-mentioned us");
			followAMentioner();
		}
	});
		});
}
 
runBot();
 
setInterval(runBot, 90000);
