import {useState, useEffect} from "react";
import {ethers} from "ethers";
import axios from 'axios';
import Web3Modal from "web3modal";

import {nftMarketAddress, nftAddress} from "../config";

import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import NFTMarket from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';


function CreatorDashboard() {
    const [nfts, setNfts] = useState([]);
    const [sold, setSold] = useState([]);
    const [loadingState, setLoadingState] = useState('not-loaded');

    const loadNFTs = async() => {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider);
        const marketContract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, signer);
        const data = await marketContract.fetchItemsCreated();

        const items = await Promise.all(data.map(async item => {
            const tokenUri = await tokenContract.tokenURI(item.tokenId);
            const metadata = await axios.get(tokenUri) // https://ipfs...
            let price = ethers.utils.formatUnits(item.price.toString(), 'ether');

            const {seller, owner, tokenId, sold} = item

            let itemRef = {
                price,
                tokenId: tokenId.toNumber(),
                seller,
                owner,
                sold,
                image: metadata.data.image,
            };

            return itemRef;
        }));

        const soldItems = items.filter(i => i.sold);
        setSold(soldItems);
        setNfts(items);
        setLoadingState('loaded');
    }

    useEffect(() => {
        loadNFTs()
    }, [])


    if(loadingState === 'loaded' && !nfts.length) return (
        <h1 className="px-20 py-10 text-3xl">
            You have not purchased anything
        </h1>
    )


    return(
        <div>
            <div className="p-4">
                <h2 className="text-2xl py-2">Items Created</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    {
                        nfts.map((nft, i) => (
                            <div key={i} className='border shadow rounded-xl overflow-hidden'>
                                <img src={nft.image} style={{height: '150px', width: '100%'}} />
                                <div className="p-4">
                                    <p className="text-2xl font-semibold">
                                        Price - {nft.price}
                                    </p>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
            <div className="px-4">
                {
                  Boolean(sold.length) && (
                      <div>
                          <h2 className="text-2xl py-2">Items Sold</h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                              {
                                  sold.map((nft, i) => (
                                      <div key={i} className='border shadow rounded-xl overflow-hidden'>
                                          <img src={nft.image} style={{height: '150px', width: '100%'}} />
                                          <div className="p-4">
                                              <p className="text-2xl font-semibold">
                                                  Price - {nft.price}
                                              </p>
                                          </div>
                                      </div>
                                  ))
                              }
                          </div>
                      </div>
                    )
                }
            </div>
        </div>
    )
}

export default CreatorDashboard;