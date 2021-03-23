//
//  CycleList.swift
//  IdleGame
//
//  Created by Jack Williams on 21/03/2021.
//

import SwiftUI

struct CycleList: View {
    @State private var showUnlockedOnly = false
    @EnvironmentObject var modelData: ModelData
    @Binding var numGold: Double

    var filteredCycles: [Cycle] {
        modelData.cycles.filter { cycle in
            (!showUnlockedOnly || cycle.isUnlocked)
        }
    }
    
    var body: some View {
        ZStack {
            VStack {
                List(filteredCycles){ cycle in
                    CycleRow(numGold: $numGold, cycle: cycle)
                }
                .frame(width: 450, height: 250, alignment: /*@START_MENU_TOKEN@*/.center/*@END_MENU_TOKEN@*/)
            }
        }
        
        
    }
}

struct CycleList_Previews: PreviewProvider {
    static var previews: some View {
        CycleList(numGold: .constant(5))
            .environmentObject(ModelData())
    }
}
