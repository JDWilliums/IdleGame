//
//  WoodAge.swift
//  IdleGame
//
//  Created by Jack Williams on 28/02/2021.
//

import SwiftUI
import Foundation

struct WoodAge: View {
    @Binding var numWood: Int
    @Binding var numGold: Int
    @Binding var numLogger: Int
    
    var body: some View {
        NavigationView {
            ZStack{
                VStack{
                    
                    HStack {
                        NavigationLink(destination: Shop(numGold: self.$numGold, numWood: self.$numWood, numLogger: self.$numLogger)) {
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
                        }
                        Spacer()
                        VStack(alignment: .trailing){
                            Text(String(numGold))
                            Text(String(numWood))
                            Text(String(numLogger))
                        }
                        Spacer()
                    }
                    Spacer()
                    Button(action: {
                        numWood = numWood + 1
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
            WoodAge(numWood: .constant(5), numGold: .constant(5), numLogger: .constant(5))
        }
    }
}
