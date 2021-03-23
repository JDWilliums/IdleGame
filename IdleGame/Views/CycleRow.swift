//
//  CycleDetail.swift
//  IdleGame
//
//  Created by Jack Williams on 20/03/2021.
//

import SwiftUI

struct CycleRow: View {
    @EnvironmentObject var modelData: ModelData
    @Binding var numGold: Double
    
    var cycleIndex: Int {
            modelData.cycles.firstIndex(where: { $0.id == cycle.id })!
    }
    
    var cycle: Cycle
    
    func buy(howMuch: Int) {
        for _ in 1...howMuch {
            if numGold >= modelData.cycles[cycleIndex].cost {
                numGold -= modelData.cycles[cycleIndex].cost
                modelData.cycles[cycleIndex].amount += 1
                print(modelData.cycles[cycleIndex].cost)
                print(modelData.cycles[cycleIndex].tax)
                modelData.cycles[cycleIndex].cost *= cycle.tax
                print(modelData.cycles[cycleIndex].cost)
                modelData.cycles[cycleIndex].cost = round(modelData.cycles[cycleIndex].cost)
                
            }
        }
        print("Bought \(howMuch) of something.")
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
        VStack {
            HStack {
                VStack(alignment:. leading){
                    HStack{
                        VStack {
                            Image(systemName: cycle.imageName)
                                .font(.system(size:25))
                                .frame(width:30, height:30)
                        }
                        Spacer()
                        VStack(alignment: .leading) {
                            Text(cycle.name)
                                .font(.system(size:20))
                        }
                        Spacer()
                        Image(systemName: "bolt.horizontal")
                        Image(systemName: "bolt.horizontal")
                        Image(systemName: "bolt.horizontal")
                        Image(systemName: "bolt.horizontal")
                    }
                    
                }
                .padding(.leading, 10.0)
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text("Collect")
                        .font(.system(size:20))
                }
                .padding(.trailing, 10.0)
            }
            
            HStack {
                VStack{
                    Text("\(cycle.amount)")
                        .font(.system(size:30))
                }
                .padding(.leading, 36.0)
                
                Spacer()
                
                VStack {
                    if modelData.cycles[cycleIndex].isUnlocked {
                        Button(action: {
                            if canAfford(objectCost: modelData.cycles[cycleIndex].cost,
                                         objectTax: modelData.cycles[cycleIndex].tax,
                                         amount: 1) {
                                buy(howMuch: 1)
                            }
                        }){
                            Text("Buy")
                        }
                    } else {
                        Button(action: {
                            if canAfford(objectCost: modelData.cycles[cycleIndex].cost,
                                         objectTax: modelData.cycles[cycleIndex].tax,
                                         amount: 1) {
                                buy(howMuch: 1)
                                modelData.cycles[cycleIndex].isUnlocked = true
                            } else {
                                print("Can't Afford.")
                            }
                            
                        }){
                            Text("Unlock")
                        }
                    }
                    
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Button(action: {
                        //
                    }){
                        Text("1x")
                            .foregroundColor(.black)
                            .font(.system(size:30))
                    }
                   
                }
                .padding(.trailing, 41.0)
            }
        }
    }
}

struct CycleRow_Previews: PreviewProvider {
    static var previews: some View {
        let cycles = ModelData().cycles

        CycleRow(numGold: .constant(5), cycle: cycles[0])
            .environmentObject(ModelData())
            .previewLayout(.fixed(width: 400, height:80))
        
        CycleRow(numGold: .constant(5), cycle: cycles[1])
            .environmentObject(ModelData())
            .previewLayout(.fixed(width: 400, height:80))
        
        CycleRow(numGold: .constant(5), cycle: cycles[2])
            .environmentObject(ModelData())
            .previewLayout(.fixed(width: 400, height:80))
    }
}
