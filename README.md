Scrapes camping info
@author: Martin

Run app in dev with nodemon (must be installed) by prepending environment variables setup in .env (for Heroku)

`LOCALENV=true nodemon main.js`  
`LOCALENV=true SCHEDULED_PARKS="70|Split Rock Lighthouse,104|Tettegouche State Park" EMAIL_ADDRESS=blastotor@gmail.com WEATHER_KEY=<from env.js> nodemon main.js`

push to Heroku:
commit your files to git then:
`git push heroku master`


Check remote logs live:
`heroku logs --tail`