//
//  NavigationBar.swift
//  IdleGame
//
//  Created by Jack Williams on 20/03/2021.
//

import SwiftUI

struct NavigationBar: View {
    
    @Binding var isHome: Bool
    @Binding var isShop: Bool
    @Binding var isUpgrade: Bool
    
    var body: some View {
        HStack {
            Spacer()
            Button(action: {
                isHome = false
                isShop = false
                isUpgrade = false
                
                isHome = true
            }){
                Image(systemName: "house")
                    .font(.system(size:30))
                    .foregroundColor(.black)
            }
            Spacer()
            Button(action: {
                isHome = false
                isShop = false
                isUpgrade = false
                
                isShop = true
            }){
                Image(systemName: "dollarsign.circle")
                    .font(.system(size:30))
                    .foregroundColor(.black)
            }
            Spacer()
            Button(action: {
                isHome = false
                isShop = false
                isUpgrade = false
                
                isUpgrade = true
            }){
                Image(systemName: "arrow.up.square")
                    .font(.system(size:30))
                    .foregroundColor(.black)
            }
            Spacer()
            Button(action: {
                // Go to ... view
            }){
                Image(systemName: "questionmark.circle")
                    .font(.system(size:30))
                    .foregroundColor(.black)
            }
            Spacer()
        }
    }
}

struct NavigationBar_Previews: PreviewProvider {
    static var previews: some View {
        NavigationBar(isHome: .constant(true),
                      isShop: .constant(false),
                      isUpgrade: .constant(false)
        )
    }
}
