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
    @Binding var numStone: Int
    @Binding var numLogger: Int
    @Binding var numMerchant: Int
    @Binding var numMiner: Int
    @Binding var costOfLogger: Double
    @Binding var loggerTax: Double
    @Binding var costOfMerchant: Double
    @Binding var merchantTax: Double
    @Binding var costOfMiner: Double
    @Binding var minerTax: Double
    @Binding var axeLevel: Int
    @Binding var axeUpgradeCost: Double
    @Binding var axeUpgradeTax: Double
    
   // @Environment(\.presentationMode) var presentationMode: Binding<PresentationMode>
    
   /* var backButton : some View { Button(action: {
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
 */
    
    func buy(costOfObject: inout Double, costOfTax: inout Double, numObject: inout Int, amount: Int) {
        for _ in 1...amount {
            if numGold >= costOfObject {
                numGold -= costOfObject
                numObject += 1
                print(costOfObject)
                print(costOfTax)
                costOfObject *= costOfTax
                print(costOfObject)
                costOfObject = round(costOfObject)
                
            }
        }
        print("Bought \(amount) of something.")
    }
    
    func canAfford(objectCost: Double, objectTax: Double, amount: Int) -> Bool {
        var tempCost = objectCost
        var finalPrice: Double = 0
        
        for _ in 1...amount {
            finalPrice += tempCost
            tempCost *= objectTax
            tempCost = round(tempCost)
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
                    Text("Gold:  \(Int(round(numGold)))")
                }
                Spacer()
                HStack {
                    Text("Buy Loggers: Cost: \(Int(round(costOfLogger)))")
                        .padding(.leading)
                    Spacer()
                    Button(action: {
                        if canAfford(objectCost: costOfLogger, objectTax: loggerTax, amount: 1) {
                            buy(costOfObject: &costOfLogger, costOfTax: &loggerTax, numObject: &numLogger, amount: 1)
                        }
                    }){
                        Text("1x")
                    }
                    Spacer()
                    Button(action: {
                        if canAfford(objectCost: costOfLogger, objectTax: loggerTax, amount: 5) {
                            buy(costOfObject: &costOfLogger, costOfTax: &loggerTax, numObject: &numLogger, amount: 5)
                        }
                    }){
                        Text("5x")
                    }
                    Spacer()
                    Button(action: {
                        if canAfford(objectCost: costOfLogger, objectTax: loggerTax, amount: 25) {
                            buy(costOfObject: &costOfLogger, costOfTax: &loggerTax, numObject: &numLogger, amount: 25)
                        }
                    }){
                        Text("25x")
                    }
                    Spacer()
                    Button(action:  {
                        let findAmount: Int = maxAmount(objectCost: costOfLogger, objectTax: loggerTax)
                        
                        if findAmount >= 1 {
                            if canAfford(objectCost: costOfLogger, objectTax: loggerTax, amount: findAmount) {
                                buy(costOfObject: &costOfLogger, costOfTax: &loggerTax, numObject: &numLogger, amount: findAmount)
                            }
                        }
                            
                    }){
                        Text("All")
                    }
                    Spacer()
                    
                }
                HStack{
                    Text("Buy Merchants: Cost: \(Int(round(costOfMerchant)))")
                        .padding(.leading)
                    Spacer()
                    Button(action: {
                        if canAfford(objectCost: costOfMerchant, objectTax: merchantTax, amount: 1) {
                            buy(costOfObject: &costOfMerchant, costOfTax: &merchantTax, numObject: &numMerchant, amount: 1)
                        }
                    }){
                        Text("1x")
                    }
                    Spacer()
                    Button(action: {
                        if canAfford(objectCost: costOfMerchant, objectTax: merchantTax, amount: 5) {
                            buy(costOfObject: &costOfMerchant, costOfTax: &merchantTax, numObject: &numMerchant, amount: 5)
                        }
                    }){
                        Text("5x")
                    }
                    Spacer()
                    Button(action: {
                        if canAfford(objectCost: costOfMerchant, objectTax: merchantTax, amount: 25) {
                            buy(costOfObject: &costOfMerchant, costOfTax: &merchantTax, numObject: &numMerchant, amount: 25)
                        }
                    }){
                        Text("25x")
                    }
                    
                    Spacer()
                    Button(action:  {
                        let findAmount: Int = maxAmount(objectCost: costOfMerchant, objectTax: merchantTax)
                        
                        if findAmount >= 1 {
                            if canAfford(objectCost: costOfMerchant, objectTax: merchantTax, amount: findAmount) {
                                buy(costOfObject: &costOfMerchant, costOfTax: &merchantTax, numObject: &numMerchant, amount: findAmount)
                            }
                        }
                            
                    }){
                        Text("All")
                    }
                    Spacer()
                }
                HStack{
                    Text("Buy Miners: Cost: \(Int(round(costOfMiner)))")
                        .padding(.leading)
                    Spacer()
                    Button(action: {
                        if canAfford(objectCost: costOfMiner, objectTax: minerTax, amount: 1) {
                            buy(costOfObject: &costOfMiner, costOfTax: &minerTax, numObject: &numMiner, amount: 1)
                        }
                    }){
                        Text("1x")
                    }
                    Spacer()
                    Button(action: {
                        if canAfford(objectCost: costOfMiner, objectTax: minerTax, amount: 5) {
                            buy(costOfObject: &costOfMiner, costOfTax: &minerTax, numObject: &numMiner, amount: 5)
                        }
                    }){
                        Text("5x")
                    }
                    Spacer()
                    Button(action: {
                        if canAfford(objectCost: costOfMiner, objectTax: minerTax, amount: 25) {
                            buy(costOfObject: &costOfMiner, costOfTax: &minerTax, numObject: &numMiner, amount: 25)
                        }
                    }){
                        Text("25x")
                    }
                    
                    Spacer()
                    Button(action:  {
                        let findAmount: Int = maxAmount(objectCost: costOfMiner, objectTax: minerTax)
                        
                        if findAmount >= 1 {
                            if canAfford(objectCost: costOfMiner, objectTax: minerTax, amount: findAmount) {
                                buy(costOfObject: &costOfMiner, costOfTax: &minerTax, numObject: &numMiner, amount: findAmount)
                            }
                        }
                            
                    }){
                        Text("All")
                    }
                    Spacer()
                }
                Spacer()
                HStack {
                    Button(action: {
                        if canAfford(objectCost: axeUpgradeCost, objectTax: axeUpgradeTax, amount: 1) {
                            print(axeUpgradeTax)
                            buy(costOfObject: &axeUpgradeCost, costOfTax: &axeUpgradeTax, numObject: &axeLevel, amount: 1)
                        }
                    }){
                        Text("Upgrade Axe")
                    }
                    Text("Cost: \(Int(round(axeUpgradeCost)))")
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
        //.navigationBarItems(trailing: backButton)
    }
    
}
   


struct Shop_Previews: PreviewProvider {
    static var previews: some View {
        Shop(navigationBarBackButtonHidden: true,
            numGold: .constant(5),
            numWood: .constant(5),
            numStone: .constant(5),
            numLogger: .constant(5),
            numMerchant: .constant(5),
            numMiner: .constant(5),
            costOfLogger: .constant(5),
            loggerTax: .constant(5),
            costOfMerchant: .constant(5),
            merchantTax: .constant(5),
            costOfMiner: .constant(5),
            minerTax: .constant(5),
            axeLevel: .constant(5),
            axeUpgradeCost: .constant(5),
            axeUpgradeTax: .constant(5)
        )
    }
}
