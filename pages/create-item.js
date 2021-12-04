import {useState} from "react";
import {ethers} from "ethers";
import {create as ipfsHttpClient} from 'ipfs-http-client';
import {useRouter} from "next/router";
import Web3Modal from "web3modal";

import {nftMarketAddress, nftAddress} from "../config";

import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import NFTMarket from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');

function CreateItem() {
    const [fileURL, setFileURL] = useState(null);
    const [formInput, updateFormInput] = useState({
        price: '',
        name: '',
        description: '',
    });
    const router = useRouter();

    const onChange = async (e) => {
        const file = e.target.files[0];

        try {
            const added = await client.add(
                file,
                {
                    progress: (prog) => console.log(`received: ${prog}`),
                }
            );
            const url = `https://ipfs.infura.io/ipfs/${added.path}`;
            setFileURL(url);
        } catch (e) {
            console.log(e);
        }
    }

    // Listing an item for sale
    const createSale = async (url) => {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        let contract = new ethers.Contract(nftAddress, NFT.abi, signer);
        let transaction = await contract.createToken(url);
        let tx = await transaction.wait();

        let event = tx.events[0];
        let value = event.args[2];
        let tokenId = value.toNumber();

        const price = ethers.utils.parseUnits(formInput.price, 'ether');

        contract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, signer);
        let listingPrice = await contract.getListingPrice();
        listingPrice = listingPrice.toString();

        transaction = await contract.createMarketItem(
            nftAddress,
            tokenId,
            price,
            {
                value: listingPrice
            }
        );

        await transaction.wait();
        router.push('/');
    }

    const createItem = async () => {
        const {name, description, price} = formInput;

        if(!name || !description || !price || !fileURL) return;

        const data = JSON.stringify({
            name, description, image: fileURL
        });

        try {
            const added = await client.add(data);
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            // after file is uploaded to IPFS, pass the URL to save it on Polygon
            createSale(url);
        } catch (e) {
            console.log('Error Uploading File', e)
        }
    }

    return(
        <div className="flex justify-center">
            <div className="w-1/2 flex flex-col pb-12">
                <input
                    placeholder="Asset Name"
                    className="mt-8 border rounded p-4"
                    onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
                />
                <textarea
                    placeholder="Asset Description"
                    className="mt-2 border rounded p-4"
                    onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
                />
                <input
                    placeholder="Asset Price in Eth"
                    className="mt-2 border rounded p-4"
                    onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
                />
                <input
                    type="file"
                    name="Asset"
                    className="my-4"
                    onChange={onChange}
                />
                {
                    fileURL && (
                        <img src={fileURL}  width='350' className="rounded mt-4"/>
                    )
                }
                <button
                    onClick={createItem}
                    className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg"
                >
                    Create Digital Asset
                </button>
            </div>
        </div>
    )
}

export default CreateItem;