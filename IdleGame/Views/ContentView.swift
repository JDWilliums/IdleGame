//
//  ContentView.swift
//  IdleGame
//
//  Created by Jack Williams on 26/02/2021.
//

import SwiftUI
import Foundation
struct ContentView: View {
    @State var numGold: Double = 0
    @State var numWood: Int = 0
    @State var numStone: Int = 0
    @State var numLogger: Int = 0
    @State var numMerchant: Int = 0
    @State var numMiner: Int = 0
    @State var costOfLogger: Double = 10
    @State var loggerTax: Double = 1.5
    @State var costOfMerchant: Double = 10
    @State var merchantTax: Double = 3
    @State var costOfMiner: Double = 1000
    @State var minerTax: Double = 1.6
    @State var axeLevel: Int = 1
    @State var axeUpgradeCost: Double = 10
    @State var axeUpgradeTax: Double = 2
    
    @State var castleWall: Int = 1
    @State var barracks: Int = 0
    @State var forge: Int = 0
    @State var library: Int = 0
    
    @State var isHome: Bool = true
    @State var isShop: Bool = false
    @State var isUpgrade: Bool = false
    
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    var body: some View {
        ZStack{
            HStack{
                
            }.onReceive(timer) { input in
                numWood += numLogger
                numStone += numMiner*2
                if numMerchant > 0 && numWood > 0 {
                    if numWood < numMerchant*5 {
                        numGold += Double(numWood)
                        numWood = 0
                    } else {
                        numGold += Double(numMerchant)*5
                        numWood -= numMerchant*5
                    }
                }
            }
            VStack {
                Header(
                    numGold: $numGold,
                    numWood: $numWood,
                    numStone: $numStone
                )
                
                Spacer()
                if isHome {
                    WoodAge(numGold: $numGold,
                             numWood: $numWood,
                             numStone: $numStone,
                             numLogger: $numLogger,
                             numMerchant: $numMerchant,
                             numMiner: $numMiner,
                             costOfLogger: $costOfLogger,
                             loggerTax: $loggerTax,
                             costOfMerchant: $costOfMerchant,
                             merchantTax: $merchantTax,
                             costOfMiner: $costOfMiner,
                             minerTax: $minerTax,
                             axeLevel: $axeLevel,
                             axeUpgradeCost: $axeUpgradeCost,
                             axeUpgradeTax: $axeUpgradeTax)
                } else if isShop {
                    Shop(navigationBarBackButtonHidden: true,
                         numGold: $numGold,
                         numWood: $numWood,
                         numStone: $numStone,
                         numLogger: $numLogger,
                         numMerchant: $numMerchant,
                         numMiner: $numMiner,
                         costOfLogger: $costOfLogger,
                         loggerTax: $loggerTax,
                         costOfMerchant: $costOfMerchant,
                         merchantTax: $merchantTax,
                         costOfMiner: $costOfMiner,
                         minerTax: $minerTax,
                         axeLevel: $axeLevel,
                         axeUpgradeCost: $axeUpgradeCost,
                         axeUpgradeTax: $axeUpgradeTax
                         )
                } else if isUpgrade {
                    Upgrade(castleWall: $castleWall,
                            barracks: $barracks,
                            forge: $forge,
                            library: $library,
                            numGold: $numGold,
                            numWood: $numWood,
                            numStone: $numStone
                    )
                }
                Spacer()
                NavigationBar(
                    isHome: $isHome,
                    isShop: $isShop,
                    isUpgrade: $isUpgrade
                )
            }
            
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
