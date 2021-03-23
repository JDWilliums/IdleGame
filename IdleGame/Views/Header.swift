//
//  Header.swift
//  IdleGame
//
//  Created by Jack Williams on 20/03/2021.
//

import SwiftUI

struct Header: View {
    @Binding var numGold: Double
    @Binding var numWood: Int
    @Binding var numStone: Int
    
    var body: some View {
        ZStack{
            HStack{
                
                Spacer()
                HStack {
                    Image(systemName: "guaranisign.circle")
                        .font(.system(size:30))
                        .foregroundColor(.black)
                    
                    Text("\(Int(round(numGold)))")
                        .font(.system(size:25))
                }
                Spacer()
                HStack {
                    Image(systemName: "w.square")
                        .font(.system(size:30))
                        .foregroundColor(.black)
                    
                    Text("\(numWood)")
                        .font(.system(size:25))
                }
                Spacer()
                HStack{
                    Image(systemName: "s.square")
                        .font(.system(size:30))
                        .foregroundColor(.black)
                    
                    Text("\(numStone)")
                        .font(.system(size:25))
                }
                Spacer()
                
                
            }
        }
    }
}

struct Header_Previews: PreviewProvider {
    static var previews: some View {
        Header(numGold: .constant(5),
               numWood: .constant(5),
               numStone: .constant(5)
        )
    }
}
