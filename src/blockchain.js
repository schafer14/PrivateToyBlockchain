/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message`
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *
 */

const SHA256 = require('crypto-js/sha256')
const {Block} = require('./block.js')
const bitcoinMessage = require('bitcoinjs-message')
const Promise = require('bluebird')
const _ = require('lodash')

class Blockchain {
  /**
   * Constructor of the class, you will need to setup your chain array and the height
   * of your chain (the length of your chain array).
   * Also everytime you create a Blockchain class you will need to initialized the chain creating
   * the Genesis Block.
   * The methods in this class will always return a Promise to allow client applications or
   * other backends to call asynchronous functions.
   */
  constructor() {
    this.chain = []
    this.initializeChain()
  }

  get height() {
    return this.chain.length
  }

  /**
   * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
   * You should use the `addBlock(block)` to create the Genesis Block
   * Passing as a data `{data: 'Genesis Block'}`
   */
  initializeChain() {
    if (this.height === 0) {
      const block = new Block({data: 'Genesis Block'})
      block.height = 0
      block.time = Math.floor(new Date().getTime() / 1000)
      block.hash = SHA256(JSON.stringify(block)).toString()
      this.chain.push(block)
    }
  }

  /**
   * _addBlock(block) will store a block in the chain
   * @param {*} block
   * The method will return a Promise that will resolve with the block added
   * or reject if an error happen during the execution.
   * You will need to check for the height to assign the `previousBlockHash`,
   * assign the `timestamp` and the correct `height`...At the end you need to
   * create the `block hash` and push the block into the chain array. Don't for get
   * to update the `this.height`
   * Note: the symbol `_` in the method name indicates in the javascript convention
   * that this method is a private method.
   */
  _addBlock(block) {
    try {
      const blk = this._addBlockSync(block)
      return Promise.resolve(blk)
    } catch (err) {
      return Promise.reject(err)
    }
  }

  // addBlockSync is a sync helper function for _addBlock
  _addBlockSync(block) {
    // Reject blocks that do not implement the block type
    if (!(block instanceof Block)) {
      throw errs.BLOCK_TYPE
    }

    // Reject if the chain is uninitialized
    if (this.height < 0) {
      throw errs.UNINITIALIZED_CHAIN
    }

    // Reject if the previous block does not implement the block type
    if (!(this.chain[this.chain.length - 1] instanceof Block)) {
      throw errs.INTERNAL_BLOCK_TYPE
    }

    // Reject if the block is older than five minutes
    const time = Math.floor(new Date().getTime() / 1000)
    if (block.time < time - 300) {
      throw errs.OLD_BLOCK
    }

    block.height = this.chain.length
    block.prevHash = this.chain[this.chain.length - 1].hash
    block.hash = block.hashF()
    this.chain.push(block)

    return block
  }

  /**
   * The requestMessageOwnershipVerification(address) method
   * will allow you  to request a message that you will use to
   * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
   * This is the first step before submit your Block.
   * The method return a Promise that will resolve with the message to be signed
   * @param {*} address
   */
  requestMessageOwnershipVerification(address) {
    return Promise.resolve(this._requestMessageOwnershipVerification(address))
  }

  // _requestMessageOwnershipVerification is a syncrhnous version of requestMessageOwnershipVerification
  _requestMessageOwnershipVerification(address) {
    const time = new Date()
      .getTime()
      .toString()
      .slice(0, -3)
    return `${address}:${time}:starRegistry`
  }

  /**
   * The submitStar(address, message, signature, star) method
   * will allow users to register a new Block with the star object
   * into the chain. This method will resolve with the Block added or
   * reject with an error.
   * Algorithm steps:
   * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
   * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
   * 3. Check if the time elapsed is less than 5 minutes
   * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
   * 5. Create the block and add it to the chain
   * 6. Resolve with the block added.
   * @param {*} address
   * @param {*} message
   * @param {*} signature
   * @param {*} star
   */
  submitStar(address, message, signature, star) {
    try {
      return Promise.resolve(
        this._submitStar(address, message, signature, star),
      )
    } catch (err) {
      return Promise.reject(err)
    }
  }

  // _submitStar is a syncronous helper for submitStar
  _submitStar(empty, message, signature, star, validateTime = true) {
    // Deconstruct message
    const [address, timeString, registry] = message.split(':')
    // Extract time in message and time five minutes ago
    const fiveMinutesAgo = Math.floor(new Date().getTime() / 1000) - 300

    // Throw an error is the message is not for this registry
    if (registry != 'starRegistry') {
      throw errs.INVALID_MESSAGE_REGISTRY
    }

    // Calculate time five miutes ago
    // Throw an error if the time field cannot be converted into a timestamp
    const generatedTime = parseInt(timeString, 10)
    if (isNaN(generatedTime)) {
      throw errs.INVALID_MESSAGE
    }

    // Throw an error if the message is older than five minutes
    if (fiveMinutesAgo > generatedTime && validateTime) {
      throw errs.OLD_MESSAGE
    }

    // Throw an error is the address is not a string
    if (typeof address !== 'string') {
      throw errs.INVALID_MESSAGE
    }

    // Throw an error if the signatures does not verify the message
    try {
      const verification = bitcoinMessage.verify(message, address, signature)
    } catch (err) {
      throw errs.INVALID_MESSAGE_SIG
    }

    if (!bitcoinMessage.verify(message, address, signature)) {
      throw errs.INVALID_MESSAGE_SIG
    }

    // Create a block with the star info
    const block = new Block({verifier: address, star: star})
    this._addBlock(block)

    return block
  }

  /**
   * This method will return a Promise that will resolve with the Block
   *  with the hash passed as a parameter.
   * Search on the chain array for the block that has the hash.
   * @param {*} hash
   */
  getBlockByHash(hash) {
    return Promise.resolve(_.find(this.chain, block => block.hash === hash))
  }

  /**
   * This method will return a Promise that will resolve with the Block object
   * with the height equal to the parameter `height`
   * @param {*} height
   */
  getBlockByHeight(height) {
    return Promise.resolve(this.chain[height])
  }

  /**
   * This method will return a Promise that will resolve with an array of Stars objects existing in the chain
   * and are belongs to the owner with the wallet address passed as parameter.
   * Remember the star should be returned decoded.
   * @param {*} address
   */
  getStarsByWalletAddress(address) {
    const stars = _.chain(this.chain)
      .filter(block => block.prevHash)
      .map(block => block._getBData())
      .filter(data => data.verifier === address)
      .map(data => data.star)
      .value()

    return Promise.resolve(stars)
  }

  /**
   * This method will return a Promise that will resolve with the list of errors when validating the chain.
   * Steps to validate:
   * 1. You should validate each block using `validateBlock`
   * 2. Each Block should check the with the previousBlockHash
   */
  validateChain() {
    return Promise.resolve(this._validateChain())
  }

  // _validateChain is a sync helper for validate chain
  _validateChain() {
    return _.reduce(
      this.chain,
      (acc, block, key) => {
        if (key !== 0 && !block._validate()) {
          acc.push({
            cause: errs.INVALID_HASH,
            block: block,
            height: block.height,
          })
        }

        if (key !== 0 && block.prevHash !== this.chain[key - 1].hash) {
          acc.push({
            cause: errs.INVALID_PREV_HASH,
            block: block,
            height: block.height,
          })
        }

        return acc
      },
      [],
    )
  }
}

exports.Blockchain = Blockchain

const errs = {
  BLOCK_TYPE: new Error('Cannot add non block to blockchain'),
  UNINITIALIZED_CHAIN: new Error('Trying to add block to uninitialized chain.'),
  INTERNAL_BLOCK_TYPE: new Error(
    'Previous block in chain is not of type block',
  ),
  OLD_BLOCK: new Error('Cannot submit a block older than five minutes'),
  OLD_MESSAGE: new Error('Cannot submit a message older than five minutes'),
  INVALID_MESSAGE_REGISTRY: new Error('Invalid message registry'),
  INVALID_MESSAGE: new Error('Invalid message format'),
  INVALID_MESSAGE_SIG: new Error('Invalid signature'),
  INTERNAL_VERIFY_ERROR: new Error('Could not verify signature'),
  INVALID_HASH: new Error('Invalid hash'),
  INVALID_PREV_HASH: new Error('Invalid previous has'),
}

exports.errs = errs
