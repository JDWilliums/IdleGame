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
    @State var numLogger: Int = 0
    @State var costOfLogger: Double = 10
    @State var loggerTax: Double = 1.5
    @State var axeLevel: Int = 1
    @State var axeUpgradeCost: Double = 10
    @State var axeUpgradeTax: Double = 1.4
    
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    var body: some View {
        HStack{
            
        }.onReceive(timer) { input in
            numWood += numLogger
        }
        
        WoodAge(numGold: $numGold, numWood: $numWood, numLogger: $numLogger, costOfLogger: $costOfLogger, loggerTax: $loggerTax, axeLevel: $axeLevel, axeUpgradeCost: $axeUpgradeCost, axeUpgradeTax: $axeUpgradeTax)
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
