//
//  Shop.swift
//  IdleGame
//
//  Created by Jack Williams on 28/02/2021.
//

import SwiftUI

struct Shop: View {
    @State var navigationBarBackButtonHidden = true
    @Binding var numGold: Int
    @Binding var numWood: Int
    @Binding var numLogger: Int
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
    
    var body: some View {
        ZStack {
            VStack {
                HStack {
                    Text("Buy Loggers: ")
                        .padding(.leading)
                    Spacer()
                    Button(action: {
                        if numGold > 9 {
                            numGold -= 10
                            numLogger += 1
                        }
                    }){
                        Text("1x")
                    }
                    Spacer()
                    Button(action: {
                        if numGold > 49 {
                            numGold -= 50
                            numLogger += 5
                        }
                    }){
                        Text("5x")
                    }
                    Spacer()
                    Button(action: {
                        if numGold > 249 {
                            numGold -= 250
                            numLogger += 25
                        }
                    }){
                        Text("25x")
                    }
                    Spacer()
                    Button(action: {
                        if numGold > 9 {
                            numLogger += Int(round(Double((numGold / 10))))
                            numGold = 0 + (numGold % 10)
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
                            numGold += numWood
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
        Shop(numGold: .constant(5), numWood: .constant(5), numLogger: .constant(5))
    }
}
