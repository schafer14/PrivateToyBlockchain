# Private Blockchain Application

Creating a toy blockchain for Udacity course on [Blockchain](https://www.udacity.com/course/blockchain-developer-nanodegree--nd1309)

## Commands

Start the application in development mode:

```
$ npm start

> project_1@1.0.0 start $PATH
> > nodemon app.js
>
> [nodemon] 1.19.1
> [nodemon] to restart at any time, enter `rs`
> [nodemon] watching: *.*
> [nodemon] starting `node app.js`
> Server Listening for port: 8000
```

Run test cases:


```
$ npm test
> project_1@1.0.0 test $PATH
> mocha test



  Block
    #constructor()
      ✓ should return an instance of the Block class
      ✓ should encode the data field as a hexidecimal string
      ✓ should throw an error when no data is provided
    #validate()
      ✓ should return a promise
      ✓ should validate a correct hash
      ✓ should fail to validate an incorrect hash
      ✓ should be ensure the block has not been changed
    #getBData()
      ✓ should return promise
      ✓ should decode the data to it's original content
      ✓ should handle data of any type that can be serialized
      ✓ should throw an error on the genisis block

  BlockChain
    #constructor()
      ✓ should have height initialized to 0
      ✓ should have the genesis block in the first position
    #_addBlock()
      ✓ should return a promise
      ✓ should increment the chain height
      ✓ should return a promise of a block
      ✓ should reject non block objects
      ✓ should reject old blocks
      ✓ should have created the block hash
      ✓ should have the previous blocks hash in the new block
      ✓ should have created a valid block
    #requestMessageOwnershipVerification
      ✓ should return a promise
      ✓ should match the spec `wallet:time:starRegistry`
    #submitStar
      ✓ should throw if registry is not correct
      ✓ should throw if generated time parsable
      ✓ should reject if the message is over five minutes old
      ✓ should reject if verification does not work
      ✓ should not throw if signature is correct
      ✓ should have a reference to the star in the block
      ✓ should have a reference to the verifiers address
    #getBlockByHash
      ✓ should get the correct block
    #getStarsByWalletAddress
      ✓ should return stars owned by the user
      ✓ should return an empty array when no stars are there
    #validateChain
      ✓ should find all the errors
      ✓ should find inaccurate hashes
      ✓ should find innaccuracies in previous hashes
      ✓ should specify the block the error occured in
      ✓ should specify the block height the error occured at


  38 passing (29ms)
```

## API Usage

Requesting the genesis block:

```
$ curl locahost:8000/block/0 | jq

  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   187  100   187    0     0  93500      0 --:--:-- --:--:-- --:--:-- 93500
{
  "hash": "ad4e782afea864b67a60f08db1b3d06770fb86c5034717507e04a5c05b6bdef4",
  "height": 0,
  "body": "7b2264617461223a2247656e6573697320426c6f636b227d",
  "time": 1565418208,
  "previousBlockHash": null
}
```

Requesting a message to verify against:

```
$ curl -X POST \
  http://localhost:8000/requestValidation \
  -H 'content-type: application/json' \
  -d '{"address": "mpxj1VFYdN6TuSTvPKrfazZiBNgeBLs7Uv"}' | jq

  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   109  100    60  100    49  30000  24500 --:--:-- --:--:-- --:--:-- 54500
"mpxj1VFYdN6TuSTvPKrfazZiBNgeBLs7Uv:1565418825:starRegistry"

```

Submitting a star:

```
$ curl -X POST \
  http://localhost:8000/submitstar \
  -H 'content-type: application/json' \
  -d '{
        "address": "mpxj1VFYdN6TuSTvPKrfazZiBNgeBLs7Uv",
        "message": "mpxj1VFYdN6TuSTvPKrfazZiBNgeBLs7Uv:1565418825:starRegistry",
        "signature": "IAV1dqooV5rdVTl6QCz0tGwTQfqU2OByKkiPUoPzMgjfKC/yBZ/816dUrEB3fIK1RCvoF2XVZAe5jtC9yKpbQVE=",
        "star": {
         "dec": "68° 52'\'' 56.9",
         "ra": "16h 29m 1.0s",
         "story": "Testing the story 4"
     }
}' | jq

  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   832  100   477  100   355   116k  88750 --:--:-- --:--:-- --:--:--  203k
{
  "height": 2,
  "body": "7b227665726966696572223a226d70786a31564659644e365475535476504b7266617a5a69424e6765424c73375576222c2273746172223a7b22646563223a223638c2b0203532272035362e39222c227261223a223136682032396d20312e3073222c2273746f7279223a2254657374696e67207468652073746f72792034227d7d",
  "time": 1565418958,
  "previousBlockHash": null,
  "prevHash": "762772fd4dde9412703490efb5638161f18c7303734c985ecb6f5f51db1c7e52",
  "hash": "9e2aa775852772a8d3ae69a41a92e4b6d700c780ffe43f803600397c8435920c"
}
```

Viewing all stars owned by a given user:

```
$ curl -X GET \
  http://localhost:8000/blocks/mpxj1VFYdN6TuSTvPKrfazZiBNgeBLs7Uv | jq 

  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   153  100   153    0     0   149k      0 --:--:-- --:--:-- --:--:--  149k
[
  {
    "dec": "68Â° 52' 56.9",
    "ra": "16h 29m 1.0s",
    "story": "Testing the story 4"
  }
]
```
