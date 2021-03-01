//
//  Shop.swift
//  IdleGame
//
//  Created by Jack Williams on 28/02/2021.
//

import SwiftUI

struct Shop: View {
    @State var navigationBarBackButtonHidden = true
    @Binding var numGold: Double
    @Binding var numWood: Int
    @Binding var numLogger: Int
    @Binding var costOfLogger: Double
    @Binding var loggerTax: Double
    @Binding var axeLevel: Int
    @Binding var axeUpgradeCost: Double
    @Binding var axeUpgradeTax: Double
    
    @Environment(\.presentationMode) var presentationMode: Binding<PresentationMode>
    
    var backButton : some View { Button(action: {
            self.presentationMode.wrappedValue.dismiss()
            }) {
                HStack {
                    Text("Go Back")
                        .padding(.all, 10)
                        .foregroundColor(.white)
                        .background(Color.black)
                        .cornerRadius(20)
                }
            }
        }
    
    func buy(object: String, amount: Int) {
        // Calculate and deliver buying upgrades/workers with
        // incremental pricing
        
        if object == "Logger" {
            for _ in 1...amount {
                if numGold >= costOfLogger {
                    numGold -= costOfLogger
                    numLogger += 1
                    costOfLogger *= loggerTax
                    costOfLogger = round(costOfLogger)
                }
            }
        }
    }
    
    func canAfford(objectCost: Double, objectTax: Double, amount: Int) -> Bool {
        var tempCost = objectCost
        var finalPrice: Double = 0
        
        for _ in 1...amount {
            finalPrice += tempCost
            tempCost *= objectTax
            tempCost = round(tempCost)
            print(finalPrice)
        }
        if numGold >= finalPrice {
            return true
        }
        
        return false
    }
    
    func maxAmount(objectCost: Double, objectTax: Double) -> Int {
        var tempPrice: Double = 0
        var tempGold: Double = 0
        tempGold += numGold
        tempPrice += objectCost
        var amount: Int = 0
        
        while tempGold >= tempPrice {
            tempGold -= tempPrice
            amount += 1
            tempPrice *= objectTax
            tempPrice = round(tempPrice)
        }
        return amount
    }
    
    var body: some View {
        ZStack {
            VStack {
                HStack {
                    Text("Buy Loggers: Cost: \(Int(round(costOfLogger)))")
                        .padding(.leading)
                    Spacer()
                    Button(action: {
                        if canAfford(objectCost: costOfLogger, objectTax: loggerTax, amount: 1) {
                            buy(object: "Logger", amount: 1)
                        }
                    }){
                        Text("1x")
                    }
                    Spacer()
                    Button(action: {
                        if canAfford(objectCost: costOfLogger, objectTax: loggerTax, amount: 5) {
                            buy(object: "Logger", amount: 5)
                        }
                    }){
                        Text("5x")
                    }
                    Spacer()
                    Button(action: {
                        if canAfford(objectCost: costOfLogger, objectTax: loggerTax, amount: 25) {
                            buy(object: "Logger", amount: 25)
                        }
                    }){
                        Text("25x")
                    }
                    Spacer()
                    Button(action:  {
                        let findAmount: Int = maxAmount(objectCost: costOfLogger, objectTax: loggerTax)
                        
                        print("Find AMOUNT: \(findAmount)")
                        if findAmount >= 1 {
                            if canAfford(objectCost: costOfLogger, objectTax: loggerTax, amount: findAmount) {
                                print("Find amount: \(findAmount)")
                                buy(object: "Logger", amount: findAmount)
                            }
                        }
                            
                    }){
                        Text("All")
                    }
                    Spacer()
                    
                }
                HStack {
                    
                    Text("Sell Wood:")
                        .padding(.leading)
                    Spacer()
                    Button(action: {
                        if numWood > 0 {
                            numWood -= 1
                            numGold += 1
                        }
                    }){
                        Text("1x")
                    }
                    Spacer()
                    Button(action: {
                        if numWood > 4 {
                            numWood -= 5
                            numGold += 5
                        }
                    }){
                        Text("5x")
                    }
                    Spacer()
                    Button(action: {
                        if numWood > 24 {
                            numWood -= 25
                            numGold += 25
                        }
                    }){
                        Text("25x")
                    }
                    Spacer()
                    Button(action: {
                        if numWood > 0 {
                            numGold += Double(numWood)
                            numWood = 0
                        }
                    }){
                        Text("All")
                    }
                    Spacer()
                }
                .padding(.top)
                Spacer()
            }
        }
        .navigationBarTitle("")
        .navigationBarBackButtonHidden(true)
        .navigationBarItems(trailing: backButton)
    }
    
}
   


struct Shop_Previews: PreviewProvider {
    static var previews: some View {
        Shop(numGold: .constant(5), numWood: .constant(5), numLogger: .constant(5), costOfLogger: .constant(5), loggerTax: .constant(5), axeLevel: .constant(5), axeUpgradeCost: .constant(5), axeUpgradeTax: .constant(5))
    }
}
