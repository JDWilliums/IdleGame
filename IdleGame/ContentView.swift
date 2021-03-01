//
//  ContentView.swift
//  IdleGame
//
//  Created by Jack Williams on 26/02/2021.
//

import SwiftUI
import Foundation
struct ContentView: View {
    @State var numGold = 0
    @State var numWood = 0
    @State var numLogger = 0
    
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    var body: some View {
        HStack{
            
        }.onReceive(timer) { input in
            numWood += numLogger
        }
        
        WoodAge(numWood: $numWood, numGold: $numGold, numLogger: $numLogger)
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
