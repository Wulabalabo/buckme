import { Transaction } from "@mysten/sui/transactions"
import { SUI_DECIMALS } from "@mysten/sui/utils"

const getBuckEnvelope = (sender:string) =>{
    const tx =  new Transaction()
    tx.setSender(sender)
    // 1 SUI = 10^9 (1,000,000,000) - the smallest unit of SUI is called MIST
    const one_Sui = Math.pow(10,SUI_DECIMALS) // 1000000000
    
    const [price_coin] = tx.splitCoins(tx.gas,[0])

   const [price] = tx.moveCall({
        package: "0xf35a1d598fb280b184fadb1d8f978b266d00de160d9831be2cad7defb582885f",
        module: "step_price", 
        function: "price",
        arguments: [
            tx.object("0xd7998de9445984797f13f34ccaf8e8d7af4e41804b2a09a070bc140a83acac36"),
            tx.object("0xb7737b1f632a647d9cdd4d091e34de92f2b32a04770d95ff66fe4ad8e5e7edae"),
            tx.object("0x6")
        ],
        typeArguments: ["0xde4d9fdd4d7a7bc84dae6e0743efa7764511dcd730606dacc73fc71cd75908b4::cny_2025::CNY_2025","0x2::sui::SUI"],
    });
    const [coin] = tx.splitCoins(tx.gas,[price.NestedResult[0]*one_Sui])
    tx.moveCall({
        package: "0xf35a1d598fb280b184fadb1d8f978b266d00de160d9831be2cad7defb582885f",
        module: "step_price",
        function: "update_price",
        arguments: [
            tx.object("0xd7998de9445984797f13f34ccaf8e8d7af4e41804b2a09a070bc140a83acac36"),
            tx.object("0xb7737b1f632a647d9cdd4d091e34de92f2b32a04770d95ff66fe4ad8e5e7edae"),
            tx.object("0x6b0c7be9929f118a9b7bbac44e56112555473e8a1ef9067cb81d0cbb5b764266"),
            tx.object("0x6")
        ],
        typeArguments: ["0xde4d9fdd4d7a7bc84dae6e0743efa7764511dcd730606dacc73fc71cd75908b4::cny_2025::CNY_2025","0x2::sui::SUI"],
    });
    const [AccountRequest] = tx.moveCall({
        package: "0xd2b2de20b6744388545eec928259eeed351cd6b347963ad569c68a7272a04b35",
        module: "account", 
        function: "request",
    });
    tx.moveCall({
        package: "0xf35a1d598fb280b184fadb1d8f978b266d00de160d9831be2cad7defb582885f",
        module: "entry", 
        function: "buy",
        arguments: [
            tx.object("0x1de0307e1e98528b188a22a7d9fba37f7230cd1271ed2584f3ed2912683aea5b"),
            tx.object("0xb7737b1f632a647d9cdd4d091e34de92f2b32a04770d95ff66fe4ad8e5e7edae"),
            tx.object("0x6b0c7be9929f118a9b7bbac44e56112555473e8a1ef9067cb81d0cbb5b764266"),
            tx.object("0x6"),
            tx.object(AccountRequest),
            tx.pure.u64(1),
            tx.gas,
            tx.pure.option('address',null)
        ],
        typeArguments: ["0xde4d9fdd4d7a7bc84dae6e0743efa7764511dcd730606dacc73fc71cd75908b4::cny_2025::CNY_2025","0x2::sui::SUI"],
    });


    tx.transferObjects([price_coin,coin],sender);
    return tx
}