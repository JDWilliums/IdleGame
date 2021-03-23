//
//  Upgrade.swift
//  IdleGame
//
//  Created by Jack Williams on 19/03/2021.
//

import SwiftUI

struct Upgrade: View {
    @Binding var castleWall: Int
    @Binding var barracks: Int
    @Binding var forge: Int
    @Binding var library: Int
    
    @Binding var numGold: Double
    @Binding var numWood: Int
    @Binding var numStone: Int
    
    var body: some View {
        ZStack {
            VStack {
                HStack {
                    Text("Gold: \(numGold)")
                }
                Spacer()
                HStack {
                    Text("Castle Wall Level: \(castleWall)")
                }
                HStack {
                    Text("Barracks Level: \(barracks)")
                }
                HStack {
                    Text("Forge Level: \(forge)")
                }
                HStack {
                    Text("Library Level: \(library)")
                }
                Spacer()
            }
        }
    }
}

struct Upgrade_Previews: PreviewProvider {
    static var previews: some View {
        Upgrade(
            castleWall: .constant(5),
            barracks: .constant(5),
            forge: .constant(5),
            library: .constant(5),
            numGold: .constant(5),
            numWood: .constant(5),
            numStone: .constant(5)
        )
    }
}
