//
//  WoodAge.swift
//  IdleGame
//
//  Created by Jack Williams on 28/02/2021.
//

import SwiftUI
import Foundation

struct WoodAge: View {
    @Binding var numGold: Double
    @Binding var numWood: Int
    @Binding var numLogger: Int
    @Binding var numMerchant: Int
    @Binding var costOfLogger: Double
    @Binding var loggerTax: Double
    @Binding var costOfMerchant: Double
    @Binding var merchantTax: Double
    @Binding var axeLevel: Int
    @Binding var axeUpgradeCost: Double
    @Binding var axeUpgradeTax: Double
    
    
    var body: some View {
        NavigationView {
            ZStack{
                VStack{
                    
                    HStack {
                        NavigationLink(destination:
                            Shop(navigationBarBackButtonHidden: true,
                                numGold: self.$numGold,
                                numWood: self.$numWood,
                                numLogger: self.$numLogger,
                                numMerchant: self.$numMerchant,
                                costOfLogger: self.$costOfLogger,
                                loggerTax: self.$loggerTax,
                                costOfMerchant: self.$costOfMerchant,
                                merchantTax: self.$merchantTax,
                                axeLevel: self.$axeLevel,
                                axeUpgradeCost: self.$axeUpgradeCost,
                                axeUpgradeTax: self.$axeUpgradeTax
                        ))
                        {
                                Text("Shop")
                            
                        }.padding(.all, 10)
                        .foregroundColor(.white)
                        .background(Color.black)
                        .cornerRadius(20)
                        .ignoresSafeArea(edges: .all)
                    }.padding()
                    
                    
                    Spacer()
                    HStack{
                        Spacer()
                        VStack(alignment: .leading){
                            Text("Gold")
                            Text("Wood")
                            Text("Logger")
                            Text("Merchant")
                        }
                        Spacer()
                        VStack(alignment: .trailing){
                            Text(String(Int(round(numGold))))
                            Text(String(numWood))
                            Text(String(numLogger))
                            Text(String(numMerchant))
                        }
                        Spacer()
                    }
                    Spacer()
                    Button(action: {
                        numWood += 1 * axeLevel
                    }){
                        Image(systemName: "leaf")
                            .font(.system(size: 100))
                            .foregroundColor(.black)
                        
                    }
                    Spacer()
                    
                }
            }
        }
    }
}

struct WoodAge_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            WoodAge(numGold: .constant(5),
                    numWood: .constant(5),
                    numLogger: .constant(5),
                    numMerchant: .constant(5),
                    costOfLogger: .constant(5),
                    loggerTax: .constant(5),
                    costOfMerchant: .constant(5),
                    merchantTax: .constant(5),
                    axeLevel: .constant(5),
                    axeUpgradeCost: .constant(5),
                    axeUpgradeTax: .constant(5)
                    )
        }
    }
}
